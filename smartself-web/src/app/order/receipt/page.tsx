"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";

interface Order {
  id: number;
  order_code: string;
  status: string;
  total: number | string;
  payment_status: string;
  pickup_token?: string | null;
}

export default function ReceiptPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pickupToken, setPickupToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  // 🔹 Fetch order details
  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}`);
        if (!res.ok) {
          const text = await res.text();
          console.error("Order fetch failed:", text);
          setError("Failed to load order details");
          setLoading(false);
          return;
        }

        const data = await res.json();
        const orderData = data.order || data;
        setOrder(orderData);

        if (orderData.pickup_token) {
          setPickupToken(orderData.pickup_token);
          const qr = await QRCode.toDataURL(orderData.pickup_token, { margin: 1, scale: 6 });
          setQrUrl(qr);
          setShowThankYou(true);
        }
      } catch (err) {
        console.error("Network error:", err);
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  // 💳 Handle payment method click
  async function handlePayment(method: string) {
    if (!order) return;
    setProcessing(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          method,
          amount: Number(order.total),
        }),
      });

      const data = await res.json();

      if (res.ok && (data.pickup_token || data.payment?.status === "captured")) {
        const token = data.pickup_token || data.order?.pickup_token;
        setPickupToken(token);
        const qr = await QRCode.toDataURL(token, { margin: 1, scale: 6 });
        setQrUrl(qr);
        setShowThankYou(true);
        setOrder({
          ...order,
          payment_status: "paid",
          pickup_token: token,
        });
      } else {
        alert(`❌ Payment failed: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("⚠️ Could not process payment. Check console for details.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <p className="text-center mt-10">Loading order summary...</p>;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;
  if (!order) return <p className="text-center mt-10">Order not found.</p>;

  const totalFormatted = Number(order.total ?? 0).toFixed(2);

  // ✅ Thank You Screen
  if (showThankYou && pickupToken) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <h1 className="text-2xl font-bold mb-2">🎉 Thank You!</h1>
        <p className="text-gray-600 mb-6">Your order has been placed successfully.</p>

        {qrUrl && (
          <div className="flex flex-col items-center mb-4">
            <img src={qrUrl} alt="Pickup QR" className="w-56 h-56 mb-2" />
            <p className="text-3xl font-mono font-bold tracking-widest">{pickupToken}</p>
          </div>
        )}

        <p className="text-gray-700">
          Please show this code at the counter to collect your order.
        </p>

        <div className="mt-6 text-sm text-gray-500">
          <p>Order ID: #{order.id}</p>
          <p>Total Paid: ৳{totalFormatted}</p>
        </div>
      </div>
    );
  }

  // 🧾 Default Summary + Payment
  return (
    <div className="p-6 max-w-lg mx-auto text-center">
      <h1 className="text-2xl font-bold mb-6">🧾 Order Summary</h1>

      <div className="border rounded-lg shadow-md p-5 bg-white mb-6 text-left">
        <p className="text-gray-700 mb-2">
          <span className="font-semibold text-black">Order Code:</span>{" "}
          {order.order_code}
        </p>
        <p className="text-gray-700 mb-2">
          <span className="font-semibold text-black">Status:</span>{" "}
          <span
            className={`${
              order.status === "pending"
                ? "text-yellow-600"
                : order.status === "preparing"
                ? "text-blue-600"
                : order.status === "ready"
                ? "text-green-600"
                : "text-gray-600"
            } font-medium`}
          >
            {order.status}
          </span>
        </p>
        <p className="text-gray-700 mb-2">
          <span className="font-semibold text-black">Payment:</span>{" "}
          <span
            className={`${
              order.payment_status === "paid"
                ? "text-green-600"
                : "text-red-600"
            } font-medium`}
          >
            {order.payment_status}
          </span>
        </p>
        <p className="text-gray-900 font-semibold text-lg">
          Total: ৳{totalFormatted}
        </p>
      </div>

      {order.payment_status !== "paid" && (
        <>
          <h2 className="text-lg font-semibold mb-3">Select Payment Method</h2>

          <div className="flex justify-center gap-4">
            <button
              disabled={processing}
              onClick={() => handlePayment("cash")}
              className={`${
                processing ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-900"
              } bg-gray-800 text-white px-4 py-2 rounded-md transition`}
            >
              Cash
            </button>

            <button
              disabled={processing}
              onClick={() => handlePayment("bkash")}
              className={`${
                processing ? "opacity-60 cursor-not-allowed" : "hover:bg-pink-700"
              } bg-pink-600 text-white px-4 py-2 rounded-md transition`}
            >
              bKash
            </button>

            <button
              disabled={processing}
              onClick={() => handlePayment("card")}
              className={`${
                processing ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"
              } bg-blue-600 text-white px-4 py-2 rounded-md transition`}
            >
              Card
            </button>
          </div>
        </>
      )}
    </div>
  );
}
