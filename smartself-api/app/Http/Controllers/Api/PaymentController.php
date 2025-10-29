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

            // ✅ Create payment record
            $payment = Payment::create([
                'order_id' => $order->id,
                'method'   => $validated['method'],
                'amount'   => $validated['amount'],
                'status'   => $validated['method'] === 'cash' ? 'initiated' : 'captured',
            ]);

            // ✅ Update order payment status
            $order->update([
                'payment_status' => $validated['method'] === 'cash' ? 'unpaid' : 'paid',
            ]);

            // ✅ Generate pickup token if payment captured
            if ($payment->status === 'captured') {
                $order->ensurePickupToken();
            }

            DB::commit();

            // ✅ Return unified success response
            return response()->json([
                'success'       => true,
                'message'       => "Payment processed successfully via {$validated['method']}.",
                'payment'       => $payment,
                'order'         => $order,
                'pickup_token'  => $order->pickup_token,
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
