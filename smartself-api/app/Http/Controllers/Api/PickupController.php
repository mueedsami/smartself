<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class PickupController extends Controller
{
    /**
     * GET /api/pickup/{pickup_token}
     * Verify QR/token and mark as collected if payment done
     */
    public function verifyPickup($pickup_token)
    {
        $order = Order::where('pickup_token', $pickup_token)->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired token.',
            ], 404);
        }

        // 🧱 Prevent duplicate collection
        if ($order->status === 'collected') {
            return response()->json([
                'success' => true,
                'message' => 'Order already collected.',
                'status' => 'collected',
                'order_id' => $order->id,
            ]);
        }

        // 🚫 Check payment
        if ($order->payment_status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Payment pending. Please complete payment before collecting.',
                'status' => $order->status,
                'order_id' => $order->id,
            ], 403);
        }

        // ✅ Update to collected
        $order->update(['status' => 'collected']);

        DB::table('order_events')->insert([
            'order_id' => $order->id,
            'status' => 'collected',
            'event_time' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => '✅ Order collected successfully.',
            'order_id' => $order->id,
            'status' => 'collected',
            'table' => DB::table('tables')->where('id', $order->table_id)->value('table_name'),
        ]);
    }
}
