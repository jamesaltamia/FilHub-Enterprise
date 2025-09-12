<?php

namespace App\Http\Controllers;

use App\Http\Controllers\BaseApiController;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends BaseApiController
{
    public function dashboard()
    {
        $stats = [
            // Overview Stats
            'total_orders' => Order::count(),
            'total_revenue' => Order::where('payment_status', 'paid')->sum('total_amount'),
            'total_products' => Product::count(),
            'total_customers' => Customer::count(),
            'pending_orders' => Order::where('order_status', 'pending')->count(),
            'completed_orders' => Order::where('order_status', 'completed')->count(),
            'outstanding_amount' => Order::whereIn('payment_status', ['pending', 'partial'])->sum('due_amount'),
            'low_stock_products' => Product::whereRaw('stock_quantity <= min_stock_level')->count(),
            
            // Today's Stats
            'today_orders' => Order::whereDate('created_at', Carbon::today())->count(),
            'today_revenue' => Order::whereDate('created_at', Carbon::today())
                ->where('payment_status', 'paid')->sum('total_amount'),
            
            // This Month's Stats
            'month_orders' => Order::whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)->count(),
            'month_revenue' => Order::whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->where('payment_status', 'paid')->sum('total_amount'),
        ];

        return $this->successResponse($stats, 'Dashboard statistics retrieved');
    }

    public function salesReport(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth());
        $groupBy = $request->get('group_by', 'day'); // day, week, month

        // Sales over time
        $salesQuery = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_status', 'paid');

        $salesData = [];
        switch ($groupBy) {
            case 'day':
                $salesData = $salesQuery
                    ->select(
                        DB::raw('DATE(created_at) as date'),
                        DB::raw('COUNT(*) as orders'),
                        DB::raw('SUM(total_amount) as revenue')
                    )
                    ->groupBy(DB::raw('DATE(created_at)'))
                    ->orderBy('date')
                    ->get();
                break;
            case 'week':
                $salesData = $salesQuery
                    ->select(
                        DB::raw('YEARWEEK(created_at) as week'),
                        DB::raw('COUNT(*) as orders'),
                        DB::raw('SUM(total_amount) as revenue')
                    )
                    ->groupBy(DB::raw('YEARWEEK(created_at)'))
                    ->orderBy('week')
                    ->get();
                break;
            case 'month':
                $salesData = $salesQuery
                    ->select(
                        DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                        DB::raw('COUNT(*) as orders'),
                        DB::raw('SUM(total_amount) as revenue')
                    )
                    ->groupBy(DB::raw('DATE_FORMAT(created_at, "%Y-%m")'))
                    ->orderBy('month')
                    ->get();
                break;
        }

        // Top selling products
        $topProducts = OrderProduct::join('products', 'order_products.product_id', '=', 'products.id')
            ->join('orders', 'order_products.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.payment_status', 'paid')
            ->select(
                'products.name',
                'products.sku',
                DB::raw('SUM(order_products.quantity) as total_sold'),
                DB::raw('SUM(order_products.total_price) as total_revenue')
            )
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderBy('total_sold', 'desc')
            ->limit(10)
            ->get();

        // Sales by category
        $categoryStats = OrderProduct::join('products', 'order_products.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->join('orders', 'order_products.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.payment_status', 'paid')
            ->select(
                'categories.name as category_name',
                DB::raw('SUM(order_products.quantity) as total_sold'),
                DB::raw('SUM(order_products.total_price) as total_revenue')
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('total_revenue', 'desc')
            ->get();

        return $this->successResponse([
            'sales_data' => $salesData,
            'top_products' => $topProducts,
            'category_stats' => $categoryStats,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'group_by' => $groupBy
            ]
        ], 'Sales report generated');
    }

    public function inventoryReport()
    {
        // Low stock products
        $lowStockProducts = Product::whereRaw('stock_quantity <= min_stock_level')
            ->with('category')
            ->select('id', 'name', 'sku', 'stock_quantity', 'min_stock_level', 'category_id')
            ->orderBy('stock_quantity', 'asc')
            ->get();

        // Out of stock products
        $outOfStockProducts = Product::where('stock_quantity', 0)
            ->with('category')
            ->select('id', 'name', 'sku', 'stock_quantity', 'category_id')
            ->get();

        // Inventory value by category
        $inventoryByCategory = Product::join('categories', 'products.category_id', '=', 'categories.id')
            ->select(
                'categories.name as category_name',
                DB::raw('COUNT(products.id) as product_count'),
                DB::raw('SUM(products.stock_quantity) as total_stock'),
                DB::raw('SUM(products.stock_quantity * products.cost) as inventory_value')
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('inventory_value', 'desc')
            ->get();

        // Total inventory stats
        $inventoryStats = [
            'total_products' => Product::count(),
            'total_stock_value' => Product::sum(DB::raw('stock_quantity * cost')),
            'total_retail_value' => Product::sum(DB::raw('stock_quantity * price')),
            'low_stock_count' => $lowStockProducts->count(),
            'out_of_stock_count' => $outOfStockProducts->count(),
        ];

        return $this->successResponse([
            'inventory_stats' => $inventoryStats,
            'low_stock_products' => $lowStockProducts,
            'out_of_stock_products' => $outOfStockProducts,
            'inventory_by_category' => $inventoryByCategory,
        ], 'Inventory report generated');
    }

    public function customerReport(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth());

        // Top customers by revenue
        $topCustomers = Customer::join('orders', 'customers.id', '=', 'orders.customer_id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.payment_status', 'paid')
            ->select(
                'customers.id',
                'customers.name',
                'customers.email',
                'customers.phone',
                DB::raw('COUNT(orders.id) as total_orders'),
                DB::raw('SUM(orders.total_amount) as total_spent')
            )
            ->groupBy('customers.id', 'customers.name', 'customers.email', 'customers.phone')
            ->orderBy('total_spent', 'desc')
            ->limit(20)
            ->get();

        // Customer acquisition over time
        $customerAcquisition = Customer::whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as new_customers')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        // Customer stats
        $customerStats = [
            'total_customers' => Customer::count(),
            'new_customers_period' => Customer::whereBetween('created_at', [$startDate, $endDate])->count(),
            'customers_with_orders' => Customer::whereHas('orders')->count(),
            'average_order_value' => Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')->avg('total_amount'),
        ];

        return $this->successResponse([
            'customer_stats' => $customerStats,
            'top_customers' => $topCustomers,
            'customer_acquisition' => $customerAcquisition,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ], 'Customer report generated');
    }

    public function profitReport(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth());

        // Profit analysis by product
        $productProfits = OrderProduct::join('products', 'order_products.product_id', '=', 'products.id')
            ->join('orders', 'order_products.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.payment_status', 'paid')
            ->select(
                'products.name',
                'products.sku',
                DB::raw('SUM(order_products.quantity) as total_sold'),
                DB::raw('SUM(order_products.total_price) as total_revenue'),
                DB::raw('SUM(order_products.quantity * products.cost) as total_cost'),
                DB::raw('SUM(order_products.total_price - (order_products.quantity * products.cost)) as total_profit'),
                DB::raw('AVG((order_products.unit_price - products.cost) / products.cost * 100) as avg_margin_percent')
            )
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderBy('total_profit', 'desc')
            ->limit(20)
            ->get();

        // Overall profit stats
        $profitStats = [
            'total_revenue' => Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')->sum('total_amount'),
            'total_cost' => OrderProduct::join('orders', 'order_products.order_id', '=', 'orders.id')
                ->join('products', 'order_products.product_id', '=', 'products.id')
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->where('orders.payment_status', 'paid')
                ->sum(DB::raw('order_products.quantity * products.cost')),
        ];

        $profitStats['total_profit'] = $profitStats['total_revenue'] - $profitStats['total_cost'];
        $profitStats['profit_margin'] = $profitStats['total_revenue'] > 0 
            ? ($profitStats['total_profit'] / $profitStats['total_revenue']) * 100 
            : 0;

        return $this->successResponse([
            'profit_stats' => $profitStats,
            'product_profits' => $productProfits,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ], 'Profit report generated');
    }

    public function exportReport(Request $request)
    {
        $reportType = $request->get('type', 'sales');
        $format = $request->get('format', 'csv');

        // This would typically generate and return a file
        // For now, we'll return the data that would be exported
        
        switch ($reportType) {
            case 'sales':
                $data = $this->salesReport($request)->getData()->data;
                break;
            case 'inventory':
                $data = $this->inventoryReport()->getData()->data;
                break;
            case 'customers':
                $data = $this->customerReport($request)->getData()->data;
                break;
            case 'profit':
                $data = $this->profitReport($request)->getData()->data;
                break;
            default:
                return $this->errorResponse('Invalid report type', 400);
        }

        return $this->successResponse([
            'report_type' => $reportType,
            'format' => $format,
            'data' => $data,
            'generated_at' => Carbon::now()
        ], 'Report export data generated');
    }
}
