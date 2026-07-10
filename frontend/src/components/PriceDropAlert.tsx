"use client";

import { useState } from "react";
import { Bell, Mail, Smartphone, Check } from "lucide-react";

interface PriceDropAlertProps {
  productId: string;
  productName: string;
  currentPrice: number;
}

export default function PriceDropAlert({ productId, productName, currentPrice }: PriceDropAlertProps) {
  const [targetPrice, setTargetPrice] = useState(Math.round(currentPrice * 0.9));
  const [contact, setContact] = useState("");
  const [type, setType] = useState<"email" | "sms">("email");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;

    setLoading(true);
    // Simulate API registration delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubscribed(true);
    setLoading(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="text-yellow-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200">Price Drop Alert</h3>
      </div>

      {subscribed ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mb-3">
            <Check size={20} />
          </div>
          <h4 className="text-xs font-semibold text-gray-200">Alert Confirmed</h4>
          <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">
            We'll ping you at {contact} once price drops below ₹{targetPrice.toLocaleString("en-IN")}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Alert Target Price</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={Math.round(currentPrice * 0.5)}
                max={currentPrice}
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseInt(e.target.value))}
                className="flex-1 accent-blue-500 h-1 bg-white/10 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-semibold font-mono text-gray-200 w-20 text-right">
                ₹{targetPrice.toLocaleString("en-IN")}
              </span>
            </div>
            <span className="text-[8px] text-gray-500 mt-1 block">
              Current lowest is ₹{currentPrice.toLocaleString("en-IN")} (Targeting {Math.round((1 - targetPrice / currentPrice) * 100)}% drop)
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("email")}
              className={`flex-1 py-1.5 rounded-lg border text-[10px] flex items-center justify-center gap-1.5 transition ${
                type === "email"
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                  : "border-glass-border bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <Mail size={12} /> Email
            </button>
            <button
              type="button"
              onClick={() => setType("sms")}
              className={`flex-1 py-1.5 rounded-lg border text-[10px] flex items-center justify-center gap-1.5 transition ${
                type === "sms"
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                  : "border-glass-border bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <Smartphone size={12} /> SMS / WA
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type={type === "email" ? "email" : "tel"}
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={type === "email" ? "Enter your email" : "Enter phone number"}
              className="flex-1 bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs px-4 py-2 rounded-xl flex items-center justify-center transition font-semibold"
            >
              Set
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
