<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\Product\CategoryController;
use App\Http\Controllers\Product\BrandController;
use App\Http\Controllers\Product\UnitController;
use App\Http\Controllers\Order\OrderController;
use App\Http\Controllers\Order\PosCartController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ImageUploadController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CanteenStallController;
use App\Http\Controllers\CanteenTenantController;
use App\Http\Controllers\CanteenRentalContractController;
use App\Http\Controllers\CanteenRentalPaymentController;
use App\Http\Controllers\CanteenDashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Public (no authentication required) and Protected (requires Sanctum auth)
|--------------------------------------------------------------------------
*/

// --------------------
// Public routes
// --------------------
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);

// Public CSV lookup
Route::get('/customer/{id}', [CustomerController::class, 'findCustomer']);

// Public endpoints for demo mode (no authentication required)
Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::put('/categories/{category}', [CategoryController::class, 'update']);
Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::put('/products/{product}', [ProductController::class, 'update']);
Route::delete('/products/{product}', [ProductController::class, 'destroy']);
Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
Route::put('/orders/{order}/payment', [OrderController::class, 'updatePayment']);
Route::get('/customers', [CustomerController::class, 'index']);
Route::post('/customers', [CustomerController::class, 'store']);
Route::put('/customers/{customer}', [CustomerController::class, 'update']);
Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);

// Additional public endpoints
Route::get('/users', function() { return response()->json(['data' => []]); });
Route::post('/users', function() { return response()->json(['message' => 'User created']); });
Route::delete('/users/{id}', function() { return response()->json(['message' => 'User deleted']); });
Route::get('/settings', function() { return response()->json(['data' => []]); });
Route::put('/settings', function() { return response()->json(['message' => 'Settings updated']); });
Route::get('/reports/sales-report', function() { return response()->json(['data' => []]); });
Route::get('/reports/products-report', function() { return response()->json(['data' => []]); });
Route::get('/reports/customers-report', function() { return response()->json(['data' => []]); });

// Serve uploaded images
Route::get('/storage/images/{filename}', function ($filename) {
    $path = storage_path('app/public/images/' . $filename);
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path);
});

// --------------------
// Protected routes (auth:sanctum required)
// --------------------
Route::middleware('auth:sanctum')->group(function () {

    // User profile
    Route::get('/user', fn (Request $request) => $request->user());
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/change-password', [AuthController::class, 'changePassword']);

    // Dashboard - admin + cashier
    Route::middleware('role:admin,cashier')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/dashboard/recent-orders', [DashboardController::class, 'recentOrders']);
        Route::get('/dashboard/low-stock-products', [DashboardController::class, 'lowStockProducts']);
    });

    // Categories
    Route::middleware('role:admin,cashier')->group(function () {
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/categories/active', [CategoryController::class, 'active']);
    });

    // Admin-only category management
    Route::middleware('role:admin')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    });

    // Products
    Route::get('/products/search', [ProductController::class, 'search']);
    Route::get('/products/low-stock', [ProductController::class, 'lowStock']);

    Route::middleware('role:admin,cashier')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        Route::post('/upload-image', [ImageUploadController::class, 'upload']);
    });

    // Admin-only advanced product management
    Route::middleware('role:admin')->group(function () {
        Route::post('/products/import', [ProductController::class, 'import']);
        Route::put('/products/{product}/stock', [ProductController::class, 'updateStock']);
    });

    // Students
    Route::middleware('role:admin,cashier')->group(function () {
        Route::post('/students/import', [StudentController::class,'import']);
        Route::get('/students/search', [StudentController::class,'search']);
    });

    // Orders
    Route::post('/orders', [OrderController::class, 'store']);

    // Customers
    Route::get('/customers/search', [CustomerController::class, 'search']);

    Route::middleware('role:admin')->group(function () {
        Route::apiResource('customers', CustomerController::class);
        Route::get('/customers/{customer}/orders', [CustomerController::class, 'orders']);
    });

    Route::middleware('role:cashier')->group(function () {
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
        Route::get('/students', [StudentController::class, 'index']);
        Route::post('/students', [StudentController::class, 'store']);
        Route::put('/students/{id}', [StudentController::class, 'update']);
        Route::delete('/students/{id}', [StudentController::class, 'destroy']);
    });

    // POS Cart
    Route::middleware('role:admin,cashier')->group(function () {
        Route::get('/pos/cart', [PosCartController::class, 'index']);
        Route::post('/pos/cart', [PosCartController::class, 'store']);
        Route::put('/pos/cart/{cart}/increment', [PosCartController::class, 'increment']);
        Route::put('/pos/cart/{cart}/decrement', [PosCartController::class, 'decrement']);
        Route::delete('/pos/cart/{cart}', [PosCartController::class, 'destroy']);
        Route::delete('/pos/cart', [PosCartController::class, 'clear']);
    });

    // Orders full CRUD
    Route::middleware('role:admin,cashier')->group(function () {
        Route::apiResource('orders', OrderController::class);
        Route::get('/orders/search', [OrderController::class, 'search']);
        Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::put('/orders/{order}/payment', [OrderController::class, 'updatePayment']);
        Route::get('/orders/{order}/invoice', [OrderController::class, 'invoice']);
        Route::get('/orders/{order}/pos-invoice', [OrderController::class, 'posInvoice']);
    });

    // Reports
    Route::middleware('role:admin,cashier')->group(function () {
        Route::get('/reports/sales-summary', [DashboardController::class, 'salesSummary']);
        Route::get('/reports/sales-report', [DashboardController::class, 'salesReport']);
        Route::get('/reports/inventory-report', [DashboardController::class, 'inventoryReport']);
    });
});

// --------------------
// Canteen Management API Routes (Public for demo mode)
// --------------------

// Canteen Stalls
Route::apiResource('canteen/stalls', CanteenStallController::class);

// Canteen Tenants
Route::apiResource('canteen/tenants', CanteenTenantController::class);

// Canteen Rental Contracts
Route::apiResource('canteen/contracts', CanteenRentalContractController::class);

// Canteen Rental Payments
Route::apiResource('canteen/payments', CanteenRentalPaymentController::class);
Route::patch('/canteen/payments/{payment}/mark-paid', [CanteenRentalPaymentController::class, 'markAsPaid']);
Route::post('/canteen/payments/generate-monthly', [CanteenRentalPaymentController::class, 'generateMonthlyPayments']);

// Canteen Dashboard
Route::get('/canteen/dashboard/stats', [CanteenDashboardController::class, 'getStats']);
Route::get('/canteen/dashboard/recent-payments', [CanteenDashboardController::class, 'getRecentPayments']);
Route::get('/canteen/dashboard/overdue-payments', [CanteenDashboardController::class, 'getOverduePayments']);
Route::get('/canteen/dashboard/monthly-revenue', [CanteenDashboardController::class, 'getMonthlyRevenue']);
Route::get('/canteen/dashboard/tenant-performance', [CanteenDashboardController::class, 'getTenantPerformance']);
