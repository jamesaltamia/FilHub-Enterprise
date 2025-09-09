<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\BaseApiController;
use App\Models\Order;
use App\Models\OrderProduct;
use App\Models\Product;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Order::with(['customer', 'user'])->orderBy('created_at', 'desc');
        
        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($customerQuery) use ($search) {
                      $customerQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by payment status
        if ($request->has('payment_status') && !empty($request->payment_status)) {
            $query->where('payment_status', $request->payment_status);
        }

        // Filter by order status
        if ($request->has('order_status') && !empty($request->order_status)) {
            $query->where('order_status', $request->order_status);
        }

        // Date range filter
        if ($request->has('date_from') && !empty($request->date_from)) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && !empty($request->date_to)) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $request->has('per_page') ? 
            $query->paginate((int) $request->per_page) : 
            $query->get();

        return $this->successResponse($orders, 'Orders retrieved');
    }

    public function show(Order $order)
    {
        $order->load(['customer', 'user', 'orderProducts.product']);
        return $this->successResponse($order, 'Order details');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|integer|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'order_status' => 'nullable|in:pending,processing,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $order = DB::transaction(function () use ($request) {
            $subtotal = 0;
            foreach ($request->items as $item) {
                $subtotal += $item['price'] * $item['qty'];
            }

            $discountAmount = $request->discount_amount ?? 0;
            $taxAmount = $request->tax_amount ?? 0;
            $totalAmount = $subtotal - $discountAmount + $taxAmount;
            $paidAmount = $request->paid_amount;
            $dueAmount = max(0, $totalAmount - $paidAmount);

            // Determine payment status
            $paymentStatus = 'pending';
            if ($paidAmount >= $totalAmount) {
                $paymentStatus = 'paid';
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'partial';
            }

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'customer_id' => $request->customer_id,
                'user_id' => $request->user()->id,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'order_status' => $request->order_status ?? 'pending',
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                OrderProduct::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['qty'],
                    'unit_price' => $item['price'],
                    'discount_amount' => 0,
                    'total_price' => $item['price'] * $item['qty'],
                ]);

                // Update product stock
                $product = Product::find($item['product_id']);
                if ($product) {
                    $product->decrement('stock_quantity', $item['qty']);
                }
            }

            return $order;
        });

        $order->load(['customer', 'user', 'orderProducts.product']);
        return $this->successResponse($order, 'Order created successfully', 201);
    }

    public function update(Request $request, Order $order)
    {
        $validator = Validator::make($request->all(), [
            'order_status' => 'required|in:pending,processing,completed,cancelled',
            'payment_status' => 'nullable|in:pending,partial,paid',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        DB::transaction(function () use ($request, $order) {
            $updateData = [
                'order_status' => $request->order_status,
                'notes' => $request->notes,
            ];

            if ($request->has('paid_amount')) {
                $updateData['paid_amount'] = $request->paid_amount;
                $updateData['due_amount'] = max(0, $order->total_amount - $request->paid_amount);
                
                // Update payment status based on paid amount
                if ($request->paid_amount >= $order->total_amount) {
                    $updateData['payment_status'] = 'paid';
                } elseif ($request->paid_amount > 0) {
                    $updateData['payment_status'] = 'partial';
                } else {
                    $updateData['payment_status'] = 'pending';
                }
            }

            $order->update($updateData);
        });

        $order->load(['customer', 'user', 'orderProducts.product']);
        return $this->successResponse($order, 'Order updated successfully');
    }

    public function destroy(Order $order)
    {
        DB::transaction(function () use ($order) {
            // Restore product stock
            foreach ($order->orderProducts as $orderProduct) {
                $product = Product::find($orderProduct->product_id);
                if ($product) {
                    $product->increment('stock_quantity', $orderProduct->quantity);
                }
            }

            // Delete order products first
            $order->orderProducts()->delete();
            
            // Delete the order
            $order->delete();
        });

        return $this->successResponse(null, 'Order deleted successfully');
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,processing,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $order->update(['order_status' => $request->status]);
        $order->load(['customer', 'user']);

        return $this->successResponse($order, 'Order status updated successfully');
    }

    public function updatePayment(Request $request, Order $order)
    {
        $validator = Validator::make($request->all(), [
            'paid_amount' => 'required|numeric|min:0|max:' . $order->total_amount,
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $paidAmount = $request->paid_amount;
        $dueAmount = max(0, $order->total_amount - $paidAmount);
        
        // Determine payment status
        $paymentStatus = 'pending';
        if ($paidAmount >= $order->total_amount) {
            $paymentStatus = 'paid';
        } elseif ($paidAmount > 0) {
            $paymentStatus = 'partial';
        }

        $order->update([
            'paid_amount' => $paidAmount,
            'due_amount' => $dueAmount,
            'payment_status' => $paymentStatus,
        ]);

        $order->load(['customer', 'user']);
        return $this->successResponse($order, 'Payment updated successfully');
    }

    public function getStats()
    {
        $stats = [
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('order_status', 'pending')->count(),
            'completed_orders' => Order::where('order_status', 'completed')->count(),
            'total_revenue' => Order::where('payment_status', 'paid')->sum('total_amount'),
            'pending_payments' => Order::whereIn('payment_status', ['pending', 'partial'])->sum('due_amount'),
        ];

        return $this->successResponse($stats, 'Order statistics retrieved');
    }
}
