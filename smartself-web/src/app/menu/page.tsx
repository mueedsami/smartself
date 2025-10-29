"use client";

import { useEffect, useState } from "react";

interface MenuItem {
  id: number;
  item_name: string;
  description: string;
  price: number;
  image_url?: string;
  category_id: number;
}

interface Category {
  id: number;
  category_name: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // 🥗 Load menu data
  useEffect(() => {
    const token = localStorage.getItem("guest_token");
    if (!token) {
      console.warn("⚠️ No guest token found");
      return;
    }

    async function loadMenu() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/menu", {
          headers: {
            "X-Guest-Token": token ?? "",
          },
        });

        const data = await res.json();
        setCategories(data.categories || []);
        setItems(data.items || []);
      } catch (err) {
        console.error("Failed to load menu:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, []);

  // ➕ Add item to cart
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [
          ...prev,
          { id: item.id, name: item.item_name, price: item.price, quantity: 1 },
        ];
      }
    });
  };

  // ➖ Decrease item
  const decreaseItem = (id: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  // 🧾 Place order
  const placeOrder = async () => {
    if (cart.length === 0) return alert("🛒 Cart is empty!");

    const guestToken = localStorage.getItem("guest_token");
    if (!guestToken) return alert("⚠️ No guest session found.");

    setPlacing(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/orders", {
      method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Guest-Token": guestToken ?? "",
        },
        body: JSON.stringify({
          items: cart.map((i) => ({
            menu_item_id: i.id,
            quantity: i.quantity,
          })),
        }),
  });


      const data = await res.json();
      if (data.success) {
        setCart([]);
        window.location.href = `/order/receipt?order_id=${data.order_id}`;
      } else {
        alert("❌ Failed to place order.");
        console.error(data.error);
      }
    } catch (err) {
      console.error("Order error:", err);
      alert("❌ Failed to connect to server.");
    } finally {
      setPlacing(false);
    }
  };

  // 💸 Calculate total
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (loading) return <p className="text-center mt-10">Loading menu...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🍽️ Menu</h1>

      {/* Menu by Category */}
      {categories.map((cat) => (
        <div key={cat.id} className="mb-10">
          <h2 className="text-xl font-semibold mb-3">{cat.category_name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items
              .filter((i) => i.category_id === cat.id)
              .map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-3 shadow-sm hover:shadow-md transition relative"
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-full h-40 object-cover rounded-md mb-2"
                    />
                  )}
                  <h3 className="font-semibold">{item.item_name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {item.description}
                  </p>
                  <p className="font-bold mb-2">৳ {item.price}</p>
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-black text-white text-sm px-3 py-1 rounded-md"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* 🛒 Cart Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            {cart.length === 0 ? (
              <p className="text-gray-600 text-sm">Cart is empty</p>
            ) : (
              <p className="text-sm font-medium">
                {cart.length} items — <span className="font-bold">৳ {total}</span>
              </p>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={placeOrder}
              disabled={placing}
              className={`${
                placing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white font-semibold px-5 py-2 rounded-md`}
            >
              {placing ? "Placing..." : "Place Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
