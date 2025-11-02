"use client";

import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

export default function PickupPage() {
  const [token, setToken] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    if (!token.trim()) return alert("Please enter or scan pickup token");

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`${API_BASE}/pickup/${token}`);
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.status === "collected") {
          setStatusMsg(`✅ ${data.message} (Order #${data.order_id})`);
        } else {
          setStatusMsg(`✅ ${data.message}`);
        }
      } else {
        setStatusMsg(`⚠️ ${data.message || "Verification failed"}`);
      }
    } catch (err) {
      console.error("Pickup verify error:", err);
      setStatusMsg("❌ Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">🎫 Verify Pickup</h1>

        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter or scan pickup token"
          className="border border-gray-300 rounded-lg px-4 py-2 w-full mb-4 text-center text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />

        <button
          onClick={handleVerify}
          disabled={loading}
          className={`w-full py-2 rounded-md text-white font-semibold ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Verifying..." : "Mark as Collected"}
        </button>

        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              statusMsg.startsWith("✅")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {statusMsg}
          </div>
        )}
      </div>
    </div>
  );
}
