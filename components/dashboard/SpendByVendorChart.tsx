"use client";

import { formatCurrency } from "@/lib/utils";

interface Props {
  data: { vendor: string; total: number }[];
}

export function SpendByVendorChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.total - a.total);
  const max = sorted[0]?.total ?? 1;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-5">
        Spend by Vendor <span className="text-slate-400 dark:text-slate-500 font-normal">(last 12 months)</span>
      </h3>
      <div className="space-y-3">
        {sorted.map(({ vendor, total }) => (
          <div key={vendor} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-xs text-slate-600 dark:text-slate-400 truncate text-right">{vendor}</span>
            <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-md transition-all duration-500"
                style={{ width: `${(total / max) * 100}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">
              {formatCurrency(total)}
            </span>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No data</p>
        )}
      </div>
    </div>
  );
}
