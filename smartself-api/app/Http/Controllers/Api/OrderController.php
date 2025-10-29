<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\OrderEvent;

class OrderController extends Controller
{
    /**
     * 🧾 Store a new order (Guest-side)
     */
    public function store(Request $request)
    {
        $guest = $request->guest_session;
        $tenantId = $request->tenant_id;
        $tableId = $request->table_id;

        if (!$guest) {
            return response()->json(['error' => 'Guest not found in request'], 400);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            // ✅ Generate a unique order code
            $orderCode = 'ORD-' . strtoupper(Str::random(6));

            // Create Order
            $order = Order::create([
                'tenant_id' => $tenantId,
                'table_id' => $tableId,
                'guest_session_id' => $guest->id,
                'order_code' => $orderCode,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'subtotal' => 0,
                'tax' => 0,
                'total' => 0,
            ]);

            $subtotal = 0;

            // Create each order item
            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::find($item['menu_item_id']);
                if (!$menuItem) continue;

                $lineTotal = $menuItem->price * $item['quantity'];
                $subtotal += $lineTotal;

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $item['quantity'],
                    'price' => $menuItem->price,
                    'total' => $lineTotal,
                ]);
            }

            $tax = 0;
            $total = $subtotal + $tax;

            $order->update([
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
            ]);

            // Log initial event
            OrderEvent::create([
                'order_id' => $order->id,
                'status' => 'pending',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'order_id' => $order->id,
                'order_code' => $orderCode,
                'message' => 'Order placed successfully!',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create order.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 👀 Show a specific order
     */
    public function show($id)
    {
        $order = Order::with('items.menuItem')->findOrFail($id);

        return response()->json([
            'success' => true,
            'order' => $order,
        ]);
    }

    /**
     * 📋 Get active orders (for admin/kitchen)
     */
    public function activeOrders(Request $request)
    {
        $tenantId = $request->tenant_id ?? 1; // fallback for demo

        $orders = Order::with('items.menuItem')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'preparing'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }

    /**
     * 🔄 Update order status (admin/kitchen)
     */
    public function updateStatus(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'status' => 'required|in:pending,preparing,ready,collected,cancelled',
        ]);

        $order = Order::find($validated['order_id']);
        $order->update(['status' => $validated['status']]);

        // Log status change in order_events
        OrderEvent::create([
            'order_id' => $order->id,
            'status' => $order->status,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Order status updated to {$order->status}.",
        ]);
    }

    // app/Http/Controllers/OrderController.php
    public function receipt(\App\Models\Order $order)
    {
        // Optional: enforce GuestSessionMiddleware / ownership checks here
        $order->load(['items', 'items.menuItem', 'payments']); // adjust relations to yours

        return response()->json([
            'order' => [
                'id' => $order->id,
                'table_id' => $order->table_id ?? null,
                'total' => $order->total ?? null,
                'status' => $order->status ?? null,
                'items' => $order->items,
                'payments' => $order->payments,
            ],
            'pickup_token' => $order->pickup_token,
        ]);
    }

}
