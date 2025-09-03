<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\Product\CategoryController;
use App\Http\Controllers\Product\BrandController;
use App\Http\Controllers\Product\UnitController;
use App\Http\Controllers\Customer\CustomerController;
use App\Http\Controllers\Supplier\SupplierController;
use App\Http\Controllers\Order\OrderController;
use App\Http\Controllers\Order\PosCartController;
use App\Http\Controllers\Dashboard\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes (no authentication required)
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);

// Protected routes (authentication required)
Route::middleware('auth:sanctum')->group(function () {
    
    // User profile
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/change-password', [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/recent-orders', [DashboardController::class, 'recentOrders']);
    Route::get('/dashboard/low-stock-products', [DashboardController::class, 'lowStockProducts']);

    // Categories
    Route::apiResource('categories', CategoryController::class);
    Route::get('/categories/active', [CategoryController::class, 'active']);

    // Brands
    Route::apiResource('brands', BrandController::class);
    Route::get('/brands/active', [BrandController::class, 'active']);

    // Units
    Route::apiResource('units', UnitController::class);
    Route::get('/units/active', [UnitController::class, 'active']);

    // Products - put specific routes BEFORE resource
    Route::get('/products/search', [ProductController::class, 'search']);
    Route::get('/products/low-stock', [ProductController::class, 'lowStock']);
    Route::post('/products/import', [ProductController::class, 'import']);
    Route::put('/products/{product}/stock', [ProductController::class, 'updateStock']);
    Route::apiResource('products', ProductController::class);

    // Orders
    Route::post('/orders', [OrderController::class, 'store']);

    // Customers
    Route::apiResource('customers', CustomerController::class);
    Route::get('/customers/search', [CustomerController::class, 'search']);
    Route::get('/customers/{customer}/orders', [CustomerController::class, 'orders']);

    // Suppliers
    Route::apiResource('suppliers', SupplierController::class);
    Route::get('/suppliers/search', [SupplierController::class, 'search']);

    // POS Cart
    Route::get('/pos/cart', [PosCartController::class, 'index']);
    Route::post('/pos/cart', [PosCartController::class, 'store']);
    Route::put('/pos/cart/{cart}/increment', [PosCartController::class, 'increment']);
    Route::put('/pos/cart/{cart}/decrement', [PosCartController::class, 'decrement']);
    Route::delete('/pos/cart/{cart}', [PosCartController::class, 'destroy']);
    Route::delete('/pos/cart', [PosCartController::class, 'clear']);

    // Orders
    Route::apiResource('orders', OrderController::class);
    Route::get('/orders/search', [OrderController::class, 'search']);
    Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::put('/orders/{order}/payment', [OrderController::class, 'updatePayment']);
    Route::get('/orders/{order}/invoice', [OrderController::class, 'invoice']);
    Route::get('/orders/{order}/pos-invoice', [OrderController::class, 'posInvoice']);

    // Reports
    Route::get('/reports/sales-summary', [DashboardController::class, 'salesSummary']);
    Route::get('/reports/sales-report', [DashboardController::class, 'salesReport']);
    Route::get('/reports/inventory-report', [DashboardController::class, 'inventoryReport']);
});
