"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = "http://127.0.0.1:8000/api";

export default function OrderStatusPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<string>("loading");

  const fetchStatus = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/orders/status/${token}`);
    const data = await res.json();
    setStatus(data.status || "not found");
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const color =
    status === "pending" ? "text-red-600" :
    status === "preparing" ? "text-yellow-600" :
    status === "ready" ? "text-green-600" :
    "text-gray-500";

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Order Status</h1>
        {token ? (
          <>
            <p className="text-lg mb-2">Pickup Token: <b>{token}</b></p>
            <p className={`text-2xl font-semibold ${color}`}>
              {status.toUpperCase()}
            </p>
          </>
        ) : (
          <p>No token provided</p>
        )}
      </div>
    </div>
  );
}
