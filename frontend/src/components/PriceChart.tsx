"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface PricePoint {
  platform: string;
  price: number;
  timestamp: string;
}

interface PriceChartProps {
  productId: string;
  historyData: PricePoint[];
}

export default function PriceChart({ historyData }: PriceChartProps) {
  const [mounted, setMounted] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (historyData.length === 0) return;

    // Group price points by timestamp (day)
    const grouped: { [key: string]: any } = {};

    historyData.forEach((pt) => {
      const date = new Date(pt.timestamp).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });

      if (!grouped[date]) {
        grouped[date] = { date };
      }
      grouped[date][pt.platform] = pt.price;
    });

    setChartData(Object.values(grouped));
  }, [historyData]);

  if (!mounted) {
    return <div className="h-64 w-full bg-glass-bg animate-pulse rounded-2xl border border-glass-border" />;
  }

  if (historyData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-glass-border bg-glass-bg text-gray-400">
        No price history tracking data available.
      </div>
    );
  }

  // Get distinct platforms for colors
  const platforms = Array.from(new Set(historyData.map((pt) => pt.platform)));
  const colors: { [key: string]: string } = {
    Amazon: "#eab308", // Yellow-500
    Flipkart: "#3b82f6", // Blue-500
    Croma: "#10b981", // Emerald-500
  };

  const prices = historyData.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-200">Historical Price Trends</h3>
          <p className="text-xs text-gray-400">Live comparison tracking chart</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
            <span className="text-gray-400 text-xs block">Lowest</span>
            <span className="text-green-400 font-medium font-mono">₹{minPrice.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
            <span className="text-gray-400 text-xs block">Average</span>
            <span className="text-blue-400 font-medium font-mono">₹{avgPrice.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">
            <span className="text-gray-400 text-xs block">Highest</span>
            <span className="text-red-400 font-medium font-mono">₹{maxPrice.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {platforms.map((platform) => (
                <linearGradient key={platform} id={`color${platform}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[platform] || "#a855f7"} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={colors[platform] || "#a855f7"} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis dataKey="date" stroke="#666" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#666"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: "12px", color: "#fff" }}
              formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`]}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "15px" }} />
            {platforms.map((platform) => (
              <Area
                key={platform}
                type="monotone"
                dataKey={platform}
                stroke={colors[platform] || "#a855f7"}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color${platform})`}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
