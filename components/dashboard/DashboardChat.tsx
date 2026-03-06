"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardMetrics } from "@/types";
import { formatCurrency } from "@/lib/utils";

const STARTERS = [
  "Give me an overview of this month's spend",
  "Which vendor costs the most?",
  "How many invoices are overdue?",
  "What's our avg monthly spend trend?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  metrics: DashboardMetrics;
}

function buildContext(metrics: DashboardMetrics): string {
  const topVendors = metrics.spendByVendor
    .slice(0, 5)
    .map((v) => `${v.vendor}: ${formatCurrency(v.total)}`)
    .join(", ");

  const recentMonths = metrics.monthlyTrend
    .slice(-3)
    .map((m) => `${m.month}: ${formatCurrency(m.total)} (paid: ${formatCurrency(m.paid)}, unpaid: ${formatCurrency(m.unpaid)})`)
    .join(" | ");

  return [
    `Unpaid invoices: ${metrics.unpaidCount} totalling ${formatCurrency(metrics.unpaidTotal)}`,
    `Overdue invoices: ${metrics.overdueCount}`,
    `Months of data tracked: ${metrics.monthlyTrend.length}`,
    `Top vendors (last 12 months): ${topVendors}`,
    `Recent monthly trend: ${recentMonths}`,
    `Upcoming due invoices: ${metrics.upcomingDue.length}`,
  ].join("\n");
}

export function DashboardChat({ metrics }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...next, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          context: buildContext(metrics),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: accumulated }]);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300",
        open ? "opacity-100" : "opacity-50 hover:opacity-80"
      )}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
      >
        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Ask AI about your dashboard</p>
          {!open && (
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              Spend insights, vendor breakdown, invoice status…
            </p>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        }
      </button>

      {/* Expanded chat */}
      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {/* Messages */}
          <div className="px-5 py-4 space-y-3 max-h-64 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#c4b5fd #f1f5f9" }}>
            {messages.length === 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Conversation starters:</p>
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 transition-colors font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                    )}
                  >
                    {m.content || (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 pb-4 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask anything about your spend…"
              disabled={streaming}
              className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors shrink-0"
            >
              {streaming
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
