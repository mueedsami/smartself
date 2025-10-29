<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GuestSessionController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All API endpoints for the SmartSelf project.
| GuestSessionMiddleware protects routes that require a valid guest token.
|
*/

// -----------------------------
// O1 — Health Check
// -----------------------------
Route::get('/health', function () {
    return response()->json(['status' => 'OK', 'timestamp' => now()]);
});

// -----------------------------
// O2–O3 — Guest Session
// -----------------------------
Route::post('/guest/start', [GuestSessionController::class, 'start']);  // create guest session
Route::get('/guest/check', [GuestSessionController::class, 'check']);  // verify session

// -----------------------------
// O4 — Menu (Protected by guest token)
// -----------------------------
Route::middleware('guest.session')->group(function () {
    Route::get('/menu', [MenuController::class, 'index']);
});

// -----------------------------
// O5–O6 — Orders
// -----------------------------

// ✅ Public endpoints
Route::get('/orders/{id}', [OrderController::class, 'show']);           // Show order (receipt)
Route::get('/orders/active', [OrderController::class, 'activeOrders']); // For admin/kitchen display
Route::post('/orders/update-status', [OrderController::class, 'updateStatus']); // Change order status

// ✅ Protected endpoints
Route::middleware('guest.session')->group(function () {
    Route::post('/orders', [OrderController::class, 'store']); // Create new order
});

// -----------------------------
// O7 — Payments
// -----------------------------
Route::post('/payments', [PaymentController::class, 'store']);
Route::get('/payments/order/{orderId}', [PaymentController::class, 'byOrder']);
Route::get('/orders/{order}/receipt', [OrderController::class, 'receipt'])
    ->middleware(['guest.session']); // use your GuestSessionMiddleware alias