"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { STATIC_PROJECTS } from "@/lib/sheets";

interface Props {
  data: { vendor: string; total: number }[];
}

const BAR_COLORS = [
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#93c5fd", // blue-300
  "#c084fc", // purple-400
  "#a5b4fc", // indigo-300
  "#7dd3fc", // sky-300
  "#c4b5fd", // violet-300
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#d8b4fe", // purple-300
];

// Build a map: vendor name (lowercase) → project names
const VENDOR_PROJECTS: Record<string, string[]> = {};
for (const project of STATIC_PROJECTS) {
  const vendors = [
    ...project.llms.map((l) => l.provider),
    ...project.services,
  ];
  for (const v of vendors) {
    const key = v.toLowerCase();
    if (!VENDOR_PROJECTS[key]) VENDOR_PROJECTS[key] = [];
    if (!VENDOR_PROJECTS[key].includes(project.name)) {
      VENDOR_PROJECTS[key].push(project.name);
    }
  }
}

function getProjects(vendor: string): string[] {
  return VENDOR_PROJECTS[vendor.toLowerCase()] ?? [];
}

export function SpendByVendorChart({ data }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sorted = [...data].sort((a, b) => b.total - a.total);
  const max = sorted[0]?.total ?? 1;
  const grandTotal = sorted.reduce((s, d) => s + d.total, 0);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
        Spend by Vendor{" "}
        <span className="text-slate-400 dark:text-slate-500 font-normal">(last 12 months)</span>
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{sorted.length} vendors · hover to see projects</p>

      <div className="overflow-y-auto max-h-72 space-y-2.5 pr-1 scrollbar-thin">
        {sorted.map(({ vendor, total }, i) => {
          const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
          const projects = getProjects(vendor);
          const isHovered = hoveredIndex === i;

          return (
            <div
              key={vendor}
              className="relative flex items-center gap-3 group"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Vendor name */}
              <span className="w-28 shrink-0 text-xs text-slate-600 dark:text-slate-400 truncate text-right">
                {vendor}
              </span>

              {/* Bar */}
              <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(total / max) * 100}%`,
                    backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                    opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                    transition: "opacity 0.15s, width 0.5s",
                  }}
                />
              </div>

              {/* Amount + % stacked */}
              <div className="w-24 shrink-0 text-right">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
                  {formatCurrency(total)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                  {pct}%
                </p>
              </div>

              {/* Hover tooltip */}
              {isHovered && (
                <div className="absolute right-0 top-full mt-1.5 z-20 bg-slate-900 dark:bg-slate-700 text-white rounded-xl shadow-xl px-3 py-2.5 min-w-44 pointer-events-none">
                  <p className="text-xs font-bold mb-1.5">{vendor}</p>
                  {projects.length > 0 ? (
                    <>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Used in</p>
                      <ul className="space-y-0.5">
                        {projects.map((p) => (
                          <li key={p} className="text-xs text-slate-200 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-[10px] text-slate-400">No project mapping found</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sorted.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No data</p>
        )}
      </div>
    </div>
  );
}
