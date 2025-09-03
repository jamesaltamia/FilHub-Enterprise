<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\BaseApiController;
use App\Models\Order;
use App\Models\OrderProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Order::with(['customer','user'])->orderBy('created_at','desc');
        if ($request->has('search')) {
            $s = $request->search;
            $query->where('order_number', 'like', "%{$s}%");
        }
        $orders = $request->has('per_page') ? $query->paginate((int) $request->per_page) : $query->get();
        return $this->successResponse($orders, 'Orders retrieved');
    }

    public function show(Order $order)
    {
        $order->load(['customer','user','orderProducts.product']);
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
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $order = DB::transaction(function () use ($request) {
            $subtotal = 0;
            foreach ($request->items as $it) {
                $subtotal += $it['price'] * $it['qty'];
            }

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'customer_id' => $request->customer_id,
                'user_id' => $request->user()->id,
                'subtotal' => $subtotal,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'total_amount' => $subtotal,
                'paid_amount' => $request->paid_amount,
                'due_amount' => max(0, $subtotal - $request->paid_amount),
                'payment_status' => $request->paid_amount >= $subtotal ? 'paid' : ($request->paid_amount > 0 ? 'partial' : 'pending'),
                'order_status' => 'completed',
            ]);

            foreach ($request->items as $it) {
                OrderProduct::create([
                    'order_id' => $order->id,
                    'product_id' => $it['product_id'],
                    'quantity' => $it['qty'],
                    'unit_price' => $it['price'],
                    'discount_amount' => 0,
                    'total_price' => $it['price'] * $it['qty'],
                ]);
            }

            return $order;
        });

        return $this->successResponse([
            'order_id' => $order->id,
            'order_number' => $order->order_number,
        ], 'Order created', 201);
    }
}
