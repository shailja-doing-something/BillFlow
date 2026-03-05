"use client";

import { useState, useCallback } from "react";
import { AlertCircle, Clock, TrendingUp, CalendarClock, RefreshCw } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { SpendRangeCard } from "@/components/dashboard/SpendByMonthCard";
import { SpendByVendorChart } from "@/components/dashboard/SpendByVendorChart";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { DashboardMetrics, FinancialRecord } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface Props {
  initial: DashboardMetrics;
}

export function DashboardClient({ initial }: Props) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initial);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setLastRefreshed(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="p-7 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">AI infrastructure spend overview</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity", loading && "opacity-60")}>
        <SpendRangeCard />
        <KPICard
          title="Unpaid Invoices"
          value={metrics.unpaidCount}
          sub={`${formatCurrency(metrics.unpaidTotal)} outstanding`}
          icon={AlertCircle}
          accent="amber"
        />
        <KPICard
          title="Due This Week"
          value={metrics.upcomingDue.length}
          sub="Due within 7 days"
          icon={Clock}
          accent="rose"
        />
        <KPICard
          title="Months Tracked"
          value={metrics.monthlyTrend.length}
          sub="Months of spend data"
          icon={TrendingUp}
          accent="emerald"
        />
      </div>

      {/* Charts */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-5 transition-opacity", loading && "opacity-60")}>
        <SpendByVendorChart data={metrics.spendByVendor} />
        <MonthlyTrendChart data={metrics.monthlyTrend} />
      </div>

      {/* Upcoming due */}
      {metrics.upcomingDue.length > 0 && (
        <div className={cn("rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-opacity", loading && "opacity-60")}>
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <CalendarClock className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Upcoming Due Invoices</h3>
            <span className="ml-auto text-xs bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-semibold px-2.5 py-0.5 rounded-full">
              {metrics.upcomingDue.length} due soon
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {metrics.upcomingDue.map((inv: FinancialRecord) => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center shrink-0">
                    <span className="text-rose-600 dark:text-rose-400 text-xs font-bold">
                      {(inv.vendor_name ?? "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{inv.vendor_name ?? "Unknown"}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Invoice #{inv.invoice_number ?? "—"} · Due {formatDate(inv.due_date)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(inv.total_amount, inv.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
