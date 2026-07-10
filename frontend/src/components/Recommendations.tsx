"use client";

import { useEffect, useState } from "react";
import { TrendingUp, ShoppingBag, ArrowRight } from "lucide-react";

interface RecommendedProduct {
  id: string;
  name: string;
  imageUrl?: string;
  category: string;
  price: number;
  dealScore: number;
}

interface RecommendationsProps {
  onSelectProduct: (query: string) => void;
}

export default function Recommendations({ onSelectProduct }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await fetch("http://localhost:3001/products/recommendations");
        const data = await res.json();
        setRecommendations(data);
      } catch (err) {
        console.error("Failed to load recommendations:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecs();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-32 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-12 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="text-blue-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-200 font-sans">Trending Value Deals</h3>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, 5).map((rec) => (
          <div
            key={rec.id}
            onClick={() => onSelectProduct(rec.name)}
            className="flex items-center justify-between p-3 rounded-xl border border-glass-border bg-white/5 hover:bg-white/10 cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              {rec.imageUrl ? (
                <img
                  src={rec.imageUrl}
                  alt={rec.name}
                  className="w-10 h-10 object-cover rounded-lg border border-glass-border bg-white"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <ShoppingBag size={16} />
                </div>
              )}
              <div className="max-w-[150px] sm:max-w-[200px]">
                <h4 className="text-xs font-medium text-gray-200 truncate">{rec.name}</h4>
                <p className="text-[10px] text-gray-400 font-mono">₹{rec.price.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/10 text-green-400">
                Score: {rec.dealScore}
              </span>
              <ArrowRight size={14} className="text-gray-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
