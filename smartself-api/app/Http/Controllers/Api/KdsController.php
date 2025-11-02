<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use App\Http\Controllers\Controller;

class KdsController extends Controller
{
    // 🔹 Fetch active orders for kitchen
    public function index()
    {
        $orders = Order::whereIn('status', ['pending', 'preparing', 'ready', 'collected'])
            ->orderBy('created_at', 'asc')
            ->get();

        $data = $orders->map(function ($order) {
            $tableName = DB::table('tables')
                ->where('tenant_id', $order->tenant_id)
                ->where('id', $order->table_id)
                ->value('table_name');

            $items = DB::table('order_items')
                ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
                ->where('order_items.order_id', $order->id)
                ->select('menu_items.name', 'order_items.quantity')
                ->get();

            return [
                'id' => $order->id, // ✅ use order ID instead of pickup_token
                'table' => $tableName ?? 'N/A',
                'status' => $order->status,
                'created_at' => $order->created_at,
                'items' => $items,
            ];
        });

        return response()->json($data);
    }

    // 🔹 Update order status
    public function updateStatus(Request $request, Order $order)
    {
        $status = $request->input('status');
        $allowed = ['pending', 'preparing', 'ready', 'collected'];

        if (!in_array($status, $allowed)) {
            return response()->json(['error' => 'Invalid status'], 422);
        }

        $validTransitions = [
            'pending'   => ['preparing'],
            'preparing' => ['ready'],
            'ready'     => ['collected'],
            'collected' => [] // ✅ prevent going back from collected
        ];

        if (!in_array($status, $validTransitions[$order->status] ?? [])) {
            return response()->json(['error' => 'Invalid transition'], 422);
        }

        $old = $order->status;
        $order->update(['status' => $status]);

        // Log event
        DB::table('order_events')->insert([
            'order_id'   => $order->id,
            'status'     => $status,
            'event_time' => Carbon::now(),
        ]);

        return response()->json(['success' => true, 'from' => $old, 'to' => $status]);
    }
}
