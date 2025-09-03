<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\BaseApiController;
use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends BaseApiController
{
    /**
     * Display dashboard overview
     */
    public function index()
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $data = [
            'today_sales' => Order::whereDate('created_at', $today)->sum('total_amount'),
            'monthly_sales' => Order::whereDate('created_at', '>=', $thisMonth)->sum('total_amount'),
            'last_month_sales' => Order::whereDate('created_at', '>=', $lastMonth)
                ->whereDate('created_at', '<', $thisMonth)
                ->sum('total_amount'),
            'total_orders' => Order::count(),
            'today_orders' => Order::whereDate('created_at', $today)->count(),
            'pending_orders' => Order::where('order_status', 'pending')->count(),
            'total_customers' => Customer::count(),
            'total_suppliers' => Supplier::count(),
            'total_products' => Product::count(),
            'low_stock_products' => Product::lowStock()->count(),
            'out_of_stock' => Product::where('stock_quantity', 0)->count(),
        ];

        return $this->successResponse($data, 'Dashboard data retrieved successfully');
    }

    /**
     * Get dashboard statistics
     */
    public function stats()
    {
        $today = Carbon::today();
        $thisWeek = Carbon::now()->startOfWeek();
        $thisMonth = Carbon::now()->startOfMonth();
        $thisYear = Carbon::now()->startOfYear();

        $stats = [
            'sales' => [
                'today' => Order::whereDate('created_at', $today)->sum('total_amount'),
                'week' => Order::whereDate('created_at', '>=', $thisWeek)->sum('total_amount'),
                'month' => Order::whereDate('created_at', '>=', $thisMonth)->sum('total_amount'),
                'year' => Order::whereDate('created_at', '>=', $thisYear)->sum('total_amount'),
            ],
            'orders' => [
                'today' => Order::whereDate('created_at', $today)->count(),
                'week' => Order::whereDate('created_at', '>=', $thisWeek)->count(),
                'month' => Order::whereDate('created_at', '>=', $thisMonth)->count(),
                'year' => Order::whereDate('created_at', '>=', $thisYear)->count(),
            ],
            'customers' => [
                'total' => Customer::count(),
                'new_this_month' => Customer::whereDate('created_at', '>=', $thisMonth)->count(),
            ],
            'products' => [
                'total' => Product::count(),
                'active' => Product::active()->count(),
                'low_stock' => Product::lowStock()->count(),
                'out_of_stock' => Product::where('stock_quantity', 0)->count(),
            ],
        ];

        return $this->successResponse($stats, 'Statistics retrieved successfully');
    }

    /**
     * Get recent orders
     */
    public function recentOrders()
    {
        $orders = Order::with(['customer', 'user'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return $this->successResponse($orders, 'Recent orders retrieved successfully');
    }

    /**
     * Get low stock products
     */
    public function lowStockProducts()
    {
        $products = Product::with(['category', 'brand', 'unit'])
            ->lowStock()
            ->active()
            ->orderBy('stock_quantity', 'asc')
            ->limit(20)
            ->get();

        return $this->successResponse($products, 'Low stock products retrieved successfully');
    }

    /**
     * Get sales summary report
     */
    public function salesSummary()
    {
        $request = request();
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

        $summary = Order::whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->select([
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_sales'),
                DB::raw('SUM(discount_amount) as total_discounts'),
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $this->successResponse($summary, 'Sales summary retrieved successfully');
    }

    /**
     * Get sales report
     */
    public function salesReport()
    {
        $request = request();
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        $perPage = $request->get('per_page', 15);

        $orders = Order::with(['customer', 'user'])
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return $this->successResponse($orders, 'Sales report retrieved successfully');
    }

    /**
     * Get inventory report
     */
    public function inventoryReport()
    {
        $request = request();
        $perPage = $request->get('per_page', 15);

        $products = Product::with(['category', 'brand', 'unit'])
            ->select([
                'id',
                'name',
                'sku',
                'stock_quantity',
                'low_stock_alert',
                'cost_price',
                'selling_price',
                'category_id',
                'brand_id',
                'unit_id',
            ])
            ->orderBy('stock_quantity', 'asc')
            ->paginate($perPage);

        return $this->successResponse($products, 'Inventory report retrieved successfully');
    }
}
