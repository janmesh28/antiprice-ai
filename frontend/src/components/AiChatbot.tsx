"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, Loader } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function AiChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AntiPrice AI Shopping Assistant. Ask me to compare products, find cheap gaming laptops, or help you decide what fits your budget!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: "user" as const, content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch (err) {
      console.error("Chatbot failed:", err);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "I'm sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[500px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-glass-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20 text-blue-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-200">AI Shopping Assistant</h3>
            <p className="text-[10px] text-gray-400">Ask for recommendations & comparisons</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white/5 border border-glass-border text-gray-300 rounded-bl-none font-light"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-glass-border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-xs text-gray-400">
              <Loader size={12} className="animate-spin" /> Thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-glass-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Best gaming laptop under ₹70,000?"
          className="flex-1 bg-white/5 border border-glass-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl flex items-center justify-center transition disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
