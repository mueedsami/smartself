"use client";

import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";
const KDS_KEY = "smartself2025chef";

export default function KdsPage() {
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/kds/orders`, {
        headers: { "x-kds-key": KDS_KEY },
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []); // ✅ safeguard
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: number, next: string) => {
    try {
      await fetch(`${API_BASE}/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-kds-key": KDS_KEY,
        },
        body: JSON.stringify({ status: next }),
      });
      fetchOrders();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const getNext = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Start Preparing", next: "preparing", color: "bg-red-600" };
      case "preparing":
        return { label: "Mark as Ready", next: "ready", color: "bg-yellow-600" };
      case "ready":
        return { label: "Mark as Collected", next: "collected", color: "bg-green-600" };
      default:
        return null; // collected → no action
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-5">Kitchen Display System</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {orders.length === 0 && (
          <p className="text-gray-500 text-center col-span-full">No active orders</p>
        )}

        {orders.map((o) => {
          const action = getNext(o.status);
          const isCollected = o.status === "collected";

          return (
            <div
              key={o.id}
              className={`rounded-xl shadow p-4 border flex flex-col justify-between transition-all duration-200 ${
                isCollected ? "bg-gray-200 opacity-80" : "bg-white"
              }`}
            >
              <div>
                <div className="flex justify-between mb-2">
                  <div>
                    <div className="text-lg font-semibold">Table {o.table}</div>
                    {/* ✅ replaced pickup_token with order ID */}
                    <div className="text-sm text-gray-500">Order #{o.id}</div>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      o.status === "ready"
                        ? "text-green-700"
                        : o.status === "preparing"
                        ? "text-yellow-700"
                        : o.status === "pending"
                        ? "text-red-700"
                        : "text-gray-600"
                    }`}
                  >
                    {o.status.toUpperCase()}
                  </div>
                </div>

                <ul className="text-sm mb-3">
                  {o.items.map((it: any, i: number) => (
                    <li key={i} className="flex justify-between">
                      <span>{it.name}</span>
                      <span>x{it.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ✅ Button logic refined */}
              {isCollected ? (
                <button
                  disabled
                  className="py-2 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed"
                >
                  ✅ Collected
                </button>
              ) : (
                action && (
                  <button
                    onClick={() => updateStatus(o.id, action.next)}
                    className={`py-2 text-white font-semibold rounded-lg ${action.color}`}
                  >
                    {action.label}
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
