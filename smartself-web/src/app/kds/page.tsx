"use client";

import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";
const KDS_KEY = "smartself2025chef";

export default function KdsPage() {
  const [orders, setOrders] = useState<any[]>([]);

  // 🔹 Fetch Orders
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/kds/orders`, {
        headers: { "x-kds-key": KDS_KEY },
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Update Status
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

  // 🔹 Get next button action based on status & payment
  const getNext = (status: string, payment_status: string) => {
    if (status === "pending")
      return { label: "Start Preparing", next: "preparing", color: "bg-red-600" };
    if (status === "preparing")
      return { label: "Mark as Ready", next: "ready", color: "bg-yellow-600" };
    if (status === "ready" && payment_status === "paid")
      return { label: "Awaiting Pickup", next: null, color: "bg-green-600", disabled: true };
    return null;
  };

  const activeOrders = orders.filter((o) => o.status !== "collected");
  const completedOrders = orders.filter((o) => o.status === "collected");

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-5">Kitchen Display System</h1>

      {/* Active Orders */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Active Orders</h2>
        {activeOrders.length === 0 && (
          <p className="text-gray-500 text-center col-span-full">No active orders</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activeOrders.map((o) => {
            const action = getNext(o.status, o.payment_status);
            const isReadyUnpaid = o.status === "ready" && o.payment_status !== "paid";
            const isPreparing = o.status === "preparing";
            const isPending = o.status === "pending";

            return (
              <div
                key={o.id}
                className={`rounded-xl shadow p-4 border flex flex-col justify-between transition-all duration-200 bg-white`}
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
                          : isPreparing
                          ? "text-yellow-700"
                          : isPending
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

                  <div className="text-sm text-gray-500 mb-2">
                    Payment:{" "}
                    <span
                      className={
                        o.payment_status === "paid"
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {o.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* 🔘 Buttons */}
                {isReadyUnpaid ? (
                  <button
                    disabled
                    className="py-2 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed"
                  >
                    Awaiting Payment
                  </button>
                ) : action ? (
                  action.disabled ? (
                    <button
                      disabled
                      className={`py-2 text-white font-semibold rounded-lg ${action.color} opacity-70 cursor-not-allowed`}
                    >
                      {action.label}
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(o.id, action.next!)}
                      className={`py-2 text-white font-semibold rounded-lg ${action.color}`}
                    >
                      {action.label}
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="py-2 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed"
                  >
                    No Action
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">✅ Completed / Collected Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {completedOrders.map((o) => (
              <div
                key={o.id}
                className="bg-gray-200 rounded-xl shadow p-4 border flex flex-col justify-between opacity-80"
              >
                <div>
                  <div className="flex justify-between mb-2">
                    <div>
                      <div className="text-lg font-semibold">Table {o.table}</div>
                      <div className="text-sm text-gray-500">Order #{o.id}</div>
                    </div>
                    <div className="text-sm font-medium text-gray-700">
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
                    <span className="text-green-600 font-medium">
                      {o.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  disabled
                  className="py-2 bg-gray-500 text-white font-semibold rounded-lg cursor-not-allowed mt-2"
                >
                  ✅ Collected
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
