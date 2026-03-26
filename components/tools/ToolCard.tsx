"use client";

import { useState } from "react";
import { Tool } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Brain, Wrench, ChevronDown, ChevronUp, AlertTriangle, Ban } from "lucide-react";

export type FlagType = "paying_not_in_use" | "never_used";

interface Props {
  tool: Tool;
  flagTypes?: FlagType[];
}

export function ToolCard({ tool, flagTypes }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasTrend = tool.monthlyTrend.length > 1;
  const isLLM = tool.type === "llm";
  const isBilledInactive = flagTypes?.includes("paying_not_in_use");
  const isNeverUsed = flagTypes?.includes("never_used");

  const borderAccent = isNeverUsed
    ? "border-l-4 border-l-red-400"
    : isBilledInactive
    ? "border-l-4 border-l-amber-400"
    : "";

  return (
    <div className={cn(
      "rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow",
      borderAccent
    )}>
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
            {isLLM ? (
              <Brain className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            ) : (
              <Wrench className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{tool.name}</p>
              {isBilledInactive && (
                <span
                  title="Being billed but not used in any currently active project"
                  className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 cursor-help"
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  No active project
                </span>
              )}
              {isNeverUsed && (
                <span
                  title="This tool has never appeared in any project past or present"
                  className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 cursor-help"
                >
                  <Ban className="w-2.5 h-2.5" />
                  Never used
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-semibold text-slate-500">
                {isLLM ? "LLM" : "Service"}
              </span>
              {" · "}
              {tool.projects.length > 0
                ? `${tool.projects.length} project${tool.projects.length > 1 ? "s" : ""}`
                : "No projects linked"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(tool.totalSpend)}</p>
          <div className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-4 bg-slate-50/50 dark:bg-slate-800/30">
          {tool.projects.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Linked Projects</p>
              <div className="flex flex-wrap gap-1.5">
                {tool.projects.map((p) => (
                  <span key={p} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {hasTrend && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Monthly Spend</p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={tool.monthlyTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `$${v}`} width={36} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
