<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
public function store(Request $request)
{
    $validated = $request->validate([
        'order_id' => 'required|exists:orders,id',
        'method'   => 'required|in:cash,bkash,card,nagad,other',
        'amount'   => 'required|numeric|min:0',
    ]);

    try {
        DB::beginTransaction();

        $order = Order::findOrFail($validated['order_id']);

        $isCash = $validated['method'] === 'cash';
        $paymentStatus = $isCash ? 'initiated' : 'captured';
        $orderPaymentStatus = $isCash ? 'unpaid' : 'paid';

        // ✅ Create payment record
        $payment = Payment::create([
            'order_id' => $order->id,
            'method'   => $validated['method'],
            'amount'   => $validated['amount'],
            'status'   => $paymentStatus,
        ]);

        // ✅ Update order payment status (paid if online, unpaid if cash)
        $order->update(['payment_status' => $orderPaymentStatus]);

        // ✅ Always generate pickup token (both cash & online)
        if (!$order->pickup_token) {
            $order->ensurePickupToken();
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => $isCash
                ? 'Cash payment recorded (awaiting cashier confirmation).'
                : "Payment confirmed via {$validated['method']}.",
            'order' => $order->fresh(),
            'pickup_token' => $order->pickup_token,
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();

        return response()->json([
            'success' => false,
            'message' => 'Failed to process payment',
            'error'   => $e->getMessage(),
        ], 500);
    }
}





    public function byOrder($orderId)
    {
        $payments = Payment::where('order_id', $orderId)->get();

        return response()->json([
            'success' => true,
            'payments' => $payments,
        ]);
    }
}
