"use client";

import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";
const CASHIER_KEY = "smartself2025cashier";

export default function CashierPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null); // track which order is being processed

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/kds/orders`, {
        headers: { "x-cashier-key": CASHIER_KEY },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data.filter((o) => o.payment_status !== "paid"));
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const markAsPaid = async (id: number) => {
    setLoadingId(id); // only this order goes into loading state
    try {
      await fetch(`${API_BASE}/orders/${id}/pay`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-cashier-key": CASHIER_KEY,
        },
      });

      // Optimistic update (faster feedback)
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, payment_status: "paid" } : o
        )
      );

      // Re-sync with backend after 1s (ensure DB consistency)
      setTimeout(fetchOrders, 1000);
    } catch (err) {
      console.error("Payment update error:", err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-5">💵 Cashier Panel</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">All payments are up to date ✅</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-xl shadow p-4 border flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between mb-2">
                  <div>
                    <div className="text-lg font-semibold">Table {o.table}</div>
                    <div className="text-sm text-gray-500">Order #{o.id}</div>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      o.status === "ready"
                        ? "text-green-700"
                        : o.status === "preparing"
                        ? "text-yellow-700"
                        : "text-red-700"
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

                <div className="text-sm text-gray-500">
                  Payment:{" "}
                  <span
                    className={`font-medium ${
                      o.payment_status === "paid"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {o.payment_status.toUpperCase()}
                  </span>
                </div>
              </div>

              {o.payment_status !== "paid" && (
                <button
                  disabled={loadingId === o.id}
                  onClick={() => markAsPaid(o.id)}
                  className={`py-2 mt-3 font-semibold rounded-lg text-white ${
                    loadingId === o.id
                      ? "bg-gray-500 cursor-wait"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {loadingId === o.id ? "Processing..." : "Mark as Paid"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
