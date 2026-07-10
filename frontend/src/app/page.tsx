"use client";

import { useState } from "react";
import { Search, Sparkles, AlertCircle, ShoppingCart, ExternalLink, RefreshCw, BarChart2, Star } from "lucide-react";
import PriceChart from "../components/PriceChart";
import ReviewIntelligence from "../components/ReviewIntelligence";
import PricePrediction from "../components/PricePrediction";
import PriceDropAlert from "../components/PriceDropAlert";
import Recommendations from "../components/Recommendations";
import AiChatbot from "../components/AiChatbot";

interface Deal {
  id: string;
  platform: string;
  price: number;
  original?: number;
  url: string;
  inStock: boolean;
  seller?: string;
  dealScore: number;
  timestamp: string;
}

interface ProductCompare {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  deals: Deal[];
  summary: {
    cheapestPlatform: string;
    lowestPrice: number;
    bestDealPlatform: string;
    bestDealScore: number;
    totalDeals: number;
  };
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductCompare[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductCompare | null>(null);
  const [activeTab, setActiveTab] = useState<"deals" | "charts" | "reviews">("deals");
  const [historyData, setHistoryData] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent | string) => {
    if (typeof e !== "string") {
      e.preventDefault();
    }
    const searchQuery = typeof e === "string" ? e : query;
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setLoading(true);
    setSelectedProduct(null);

    try {
      const res = await fetch(`http://localhost:3001/products/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data);
      if (data.length > 0) {
        setSelectedProduct(data[0]);
        fetchHistory(data[0].id);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3001/products/${id}/history`);
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error("History load failed:", err);
    }
  };

  const handleSelectProduct = (prod: ProductCompare) => {
    setSelectedProduct(prod);
    fetchHistory(prod.id);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 relative">
      {/* Decorative Orbs */}
      <div className="glow-orb w-[500px] h-[500px] bg-blue-600/10 top-[-10%] left-[-10%]" />
      <div className="glow-orb w-[400px] h-[400px] bg-purple-600/10 bottom-[10%] right-[-10%]" />

      {/* Main Header */}
      <header className="px-6 py-6 border-b border-glass-border backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-xl text-white font-bold flex items-center justify-center">
              A
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                AntiPrice AI
              </h1>
              <p className="text-[9px] text-gray-400">Cheapest, Safest, Best Value Aggregation</p>
            </div>
          </div>
          <div className="text-xs text-gray-400 font-mono hidden sm:block">
            Beta v1.0.0
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <main className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative">
        <div className="lg:col-span-8 space-y-8">
          {/* Search Box */}
          <div className="glass-panel rounded-3xl p-8 text-center space-y-6">
            <div className="max-w-lg mx-auto space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white font-sans sm:text-3xl">
                Compare Price Intelligence Instantly
              </h2>
              <p className="text-xs text-gray-400 font-light">
                Search electronic items in India (iPhone 16, RTX laptops, MacBooks) to extract value scores.
              </p>
            </div>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2 relative">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 text-gray-500" size={16} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="iPhone 16 Pro, Samsung S25 Ultra, Gaming Laptop..."
                  className="w-full bg-white/5 border border-glass-border rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs px-6 py-3 rounded-2xl transition flex items-center gap-2"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : "Compare"}
              </button>
            </form>
          </div>

          {/* Loading Skeletal */}
          {loading && (
            <div className="space-y-6">
              <div className="h-24 bg-white/5 rounded-3xl animate-pulse" />
              <div className="h-64 bg-white/5 rounded-3xl animate-pulse" />
            </div>
          )}

          {/* Results section */}
          {!loading && results.length > 0 && selectedProduct && (
            <div className="space-y-6">
              {/* Product overview summary bar */}
              <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded-xl border border-glass-border bg-white"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                      P
                    </div>
                  )}
                  <div>
                    <h3 className="text-md font-semibold text-white truncate max-w-sm sm:max-w-md">{selectedProduct.name}</h3>
                    <p className="text-[10px] text-gray-400">Value Summary Overview</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto text-center">
                  <div className="bg-white/5 border border-glass-border px-4 py-2 rounded-xl">
                    <span className="text-[9px] text-gray-500 block">Cheapest</span>
                    <span className="text-xs font-semibold text-green-400 truncate block">
                      {selectedProduct.summary.cheapestPlatform}
                    </span>
                  </div>
                  <div className="bg-white/5 border border-glass-border px-4 py-2 rounded-xl">
                    <span className="text-[9px] text-gray-500 block">Lowest Price</span>
                    <span className="text-xs font-semibold text-white font-mono block">
                      ₹{selectedProduct.summary.lowestPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="bg-white/5 border border-glass-border px-4 py-2 rounded-xl">
                    <span className="text-[9px] text-gray-500 block">Best Deal</span>
                    <span className="text-xs font-semibold text-blue-400 truncate block">
                      {selectedProduct.summary.bestDealPlatform}
                    </span>
                  </div>
                  <div className="bg-white/5 border border-glass-border px-4 py-2 rounded-xl">
                    <span className="text-[9px] text-gray-500 block">Deal Score</span>
                    <span className="text-xs font-semibold text-yellow-400 font-mono block">
                      {selectedProduct.summary.bestDealScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs layout */}
              <div className="flex gap-2 border-b border-glass-border pb-1">
                <button
                  onClick={() => setActiveTab("deals")}
                  className={`text-xs px-4 py-2 font-medium transition border-b-2 ${
                    activeTab === "deals" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  Platform Deals ({selectedProduct.deals.length})
                </button>
                <button
                  onClick={() => setActiveTab("charts")}
                  className={`text-xs px-4 py-2 font-medium transition border-b-2 ${
                    activeTab === "charts" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  Price Charts & History
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`text-xs px-4 py-2 font-medium transition border-b-2 ${
                    activeTab === "reviews" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  AI Review Intelligence
                </button>
              </div>

              {/* Tab Content 1: Deals Table */}
              {activeTab === "deals" && (
                <div className="glass-panel rounded-3xl overflow-hidden border border-glass-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-glass-border bg-white/[0.02] text-xs text-gray-400">
                          <th className="px-6 py-4">Platform</th>
                          <th className="px-6 py-4">Seller Info</th>
                          <th className="px-6 py-4">Price Offer</th>
                          <th className="px-6 py-4">Deal Score</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass-border text-xs">
                        {selectedProduct.deals.map((deal) => {
                          const discount = deal.original ? Math.round(((deal.original - deal.price) / deal.original) * 100) : 0;
                          return (
                            <tr key={deal.id} className="hover:bg-white/[0.01] transition">
                              <td className="px-6 py-4 font-semibold text-gray-200">
                                {deal.platform}
                              </td>
                              <td className="px-6 py-4 text-gray-400">
                                {deal.seller || "Authorized Retailer"}
                              </td>
                              <td className="px-6 py-4 space-y-1">
                                <div className="font-semibold text-white font-mono">
                                  ₹{deal.price.toLocaleString("en-IN")}
                                </div>
                                {deal.original && (
                                  <div className="text-[10px] text-gray-500 flex items-center gap-1.5 font-mono">
                                    <span className="line-through">₹{deal.original.toLocaleString("en-IN")}</span>
                                    <span className="text-green-500">-{discount}%</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono ${
                                  deal.dealScore >= 80 ? "border-green-500/20 bg-green-500/10 text-green-400" :
                                  deal.dealScore >= 60 ? "border-blue-500/20 bg-blue-500/10 text-blue-400" :
                                  "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                                }`}>
                                  {deal.dealScore} / 100
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <a
                                  href={deal.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-white/5 border border-glass-border hover:bg-white/10 text-white px-3 py-1.5 rounded-lg transition"
                                >
                                  Go to Store <ExternalLink size={10} />
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Charts */}
              {activeTab === "charts" && (
                <PriceChart productId={selectedProduct.id} historyData={historyData} />
              )}

              {/* Tab Content 3: Review summary */}
              {activeTab === "reviews" && (
                <ReviewIntelligence productId={selectedProduct.id} />
              )}
            </div>
          )}

          {/* Fallback search display if not loaded yet */}
          {!loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-3xl border border-glass-border bg-glass-bg">
              <ShoppingCart className="text-gray-600" size={48} />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-300">Start Price Tracker Scrapers</h3>
                <p className="text-xs text-gray-500 max-w-xs font-light">
                  Type a product name above like "iPhone 16" and we will trigger live scrapers on Amazon, Flipkart, and Croma.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar panels */}
        <div className="lg:col-span-4 space-y-8">
          {/* Actionable widgets related to selected product */}
          {selectedProduct && (
            <>
              <PricePrediction productId={selectedProduct.id} />
              <PriceDropAlert
                productId={selectedProduct.id}
                productName={selectedProduct.name}
                currentPrice={selectedProduct.summary.lowestPrice}
              />
            </>
          )}

          {/* Chatbot Interface always available */}
          <AiChatbot />

          {/* Recommendations list */}
          <Recommendations onSelectProduct={(term) => handleSearch(term)} />
        </div>
      </main>
    </div>
  );
}
