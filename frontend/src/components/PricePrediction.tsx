"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";

interface Prediction {
  trend: string;
  predictionText: string;
  expectedPrice7Days: number | null;
  expectedPrice30Days: number | null;
  confidence: number;
}

interface PricePredictionProps {
  productId: string;
}

export default function PricePrediction({ productId }: PricePredictionProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrediction() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/ai/${productId}/predict`);
        const data = await res.json();
        setPrediction(data);
      } catch (err) {
        console.error("Failed to fetch price prediction:", err);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchPrediction();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-32 bg-white/10 rounded mb-4" />
        <div className="h-10 bg-white/5 rounded" />
      </div>
    );
  }

  if (!prediction) return null;

  const getTrendStyles = (trend: string) => {
    switch (trend) {
      case "DOWNWARD":
        return {
          icon: <TrendingDown className="text-green-400" size={20} />,
          bg: "bg-green-500/10 border-green-500/20 text-green-400",
          title: "Price Drop Expected",
        };
      case "UPWARD":
        return {
          icon: <TrendingUp className="text-red-400" size={20} />,
          bg: "bg-red-500/10 border-red-500/20 text-red-400",
          title: "Price Rise Expected",
        };
      default:
        return {
          icon: <RefreshCw className="text-blue-400" size={20} />,
          bg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
          title: "Price Projected Stable",
        };
    }
  };

  const styles = getTrendStyles(prediction.trend);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {styles.icon}
          <h3 className="text-sm font-semibold text-gray-200">{styles.title}</h3>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${styles.bg}`}>
          Confidence: {prediction.confidence}%
        </span>
      </div>

      <div className="mb-4 bg-white/5 p-4 rounded-xl border border-glass-border">
        <p className="text-xs text-gray-300 leading-relaxed font-light">{prediction.predictionText}</p>
      </div>

      {prediction.expectedPrice7Days && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/5 border border-glass-border rounded-xl">
            <span className="text-[10px] text-gray-400 block mb-1">Expected in 7 Days</span>
            <span className="text-sm font-semibold text-gray-200 font-mono">
              ₹{prediction.expectedPrice7Days.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-3 bg-white/5 border border-glass-border rounded-xl">
            <span className="text-[10px] text-gray-400 block mb-1">Expected in 30 Days</span>
            <span className="text-sm font-semibold text-gray-200 font-mono">
              ₹{prediction.expectedPrice30Days?.toLocaleString("en-IN") || "N/A"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
