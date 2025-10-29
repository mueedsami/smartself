"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qrToken = urlParams.get("table");

    if (!qrToken) {
      setLoading(false);
      return;
    }

    async function startSession() {
      const res = await fetch("http://127.0.0.1:8000/api/guest/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_slug: "demo-cafe",
          qr_token: qrToken,
        }),
      });
      const data = await res.json();
      setSession(data);
      localStorage.setItem("guest_token", data.guest_token);
      setLoading(false);
    }

    startSession();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!session?.success)
    return <p>Invalid or expired table QR. Please try again.</p>;

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">Welcome to {session.table}</h1>
      <p>Your guest session is active.</p>
      <p className="text-sm text-gray-600">
        Expires at: {new Date(session.expires_at).toLocaleTimeString()}
      </p>
      <a
        href="/menu"
        className="mt-4 inline-block bg-black text-white px-4 py-2 rounded-md"
      >
        View Menu
      </a>
    </div>
  );
}
