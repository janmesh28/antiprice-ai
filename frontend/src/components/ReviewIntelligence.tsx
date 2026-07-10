"use client";

import { useEffect, useState } from "react";
import { Star, AlertTriangle, ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";

interface ReviewAnalysis {
  summary: string;
  sentimentScore: number;
  praises: string[];
  complaints: string[];
  reliabilityScore: number;
}

interface ReviewIntelligenceProps {
  productId: string;
}

export default function ReviewIntelligence({ productId }: ReviewIntelligenceProps) {
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/ai/${productId}/reviews`);
        const data = await res.json();
        setAnalysis(data);
      } catch (err) {
        console.error("Failed to fetch review analysis:", err);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchAnalysis();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-32 bg-white/10 rounded mb-4" />
        <div className="h-4 w-full bg-white/5 rounded mb-2" />
        <div className="h-4 w-2/3 bg-white/5 rounded" />
      </div>
    );
  }

  if (!analysis) return null;

  const getSentimentLabel = (score: number) => {
    if (score >= 80) return { label: "Extremely Positive", color: "text-green-400 bg-green-500/10 border-green-500/20" };
    if (score >= 60) return { label: "Positive", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    if (score >= 40) return { label: "Neutral", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" };
    return { label: "Negative", color: "text-red-400 bg-red-500/10 border-red-500/20" };
  };

  const sentiment = getSentimentLabel(analysis.sentimentScore);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-6 flex flex-wrap gap-4 justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-200">AI Review Intelligence</h3>
          <p className="text-xs text-gray-400">Synthesized sentiment analysis of customer reviews</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-xs px-3 py-1 rounded-full border ${sentiment.color}`}>
            {sentiment.label} ({analysis.sentimentScore}%)
          </span>
          <span className="text-xs px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 flex items-center gap-1">
            <CheckCircle2 size={12} />
            Reliability: {analysis.reliabilityScore}%
          </span>
        </div>
      </div>

      <div className="mb-6 bg-white/5 p-4 rounded-xl border border-glass-border">
        <p className="text-sm text-gray-300 leading-relaxed font-light">{analysis.summary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10">
          <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2 mb-3">
            <ThumbsUp size={16} /> Key Praises
          </h4>
          <ul className="space-y-2">
            {analysis.praises.map((p, idx) => (
              <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
          <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
            <ThumbsDown size={16} /> Key Complaints
          </h4>
          <ul className="space-y-2">
            {analysis.complaints.map((c, idx) => (
              <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
