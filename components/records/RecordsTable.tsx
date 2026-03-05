"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { FinancialRecord, PaginatedResult } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { InvoiceDrawer } from "./InvoiceDrawer";
import { ChevronLeft, ChevronRight, RefreshCw, ChevronDown, X } from "lucide-react";

interface Props {
  initial: PaginatedResult<FinancialRecord>;
  vendors: string[];
}

const STATUS_OPTIONS = ["", "pending", "paid", "overdue"];

export function RecordsTable({ initial, vendors: initialVendors }: Props) {
  const [data, setData] = useState(initial);
  const [vendors, setVendors] = useState<string[]>(initialVendors);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [vendorOpen, setVendorOpen] = useState(false);
  const vendorRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
  });
  const [selected, setSelected] = useState<FinancialRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Close vendor dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (vendorRef.current && !vendorRef.current.contains(e.target as Node)) {
        setVendorOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const fetchVendors = useCallback(async () => {
    const res = await fetch("/api/invoices/vendors");
    if (res.ok) {
      const json = await res.json();
      setVendors(json.vendors ?? []);
    }
  }, []);

  const fetchData = useCallback(async (f: typeof filters, sv: string[]) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sv.length > 0) params.set("vendor", sv.join(","));
    if (f.status) params.set("status", f.status);
    if (f.dateFrom) params.set("dateFrom", f.dateFrom);
    if (f.dateTo) params.set("dateTo", f.dateTo);
    params.set("page", String(f.page));
    params.set("pageSize", "20");
    const res = await fetch(`/api/invoices?${params}`);
    const json = await res.json();
    setData(json);
    setLastRefreshed(new Date());
    setLoading(false);
  }, []);

  function applyFilter(key: string, value: string) {
    const next = { ...filters, [key]: value, page: 1 };
    setFilters(next);
    fetchData(next, selectedVendors);
  }

  function toggleVendor(v: string) {
    const next = selectedVendors.includes(v)
      ? selectedVendors.filter((x) => x !== v)
      : [...selectedVendors, v];
    setSelectedVendors(next);
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    fetchData(nextFilters, next);
  }

  function clearVendors() {
    setSelectedVendors([]);
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    fetchData(nextFilters, []);
  }

  function goPage(p: number) {
    const next = { ...filters, page: p };
    setFilters(next);
    fetchData(next, selectedVendors);
  }

  function handleRefresh() {
    fetchVendors();
    fetchData(filters, selectedVendors);
  }

  function handleMarkedPaid(id: string) {
    setData((prev) => ({
      ...prev,
      data: prev.data.map((r) =>
        r.id === id ? { ...r, payment_status: "paid" } : r
      ),
    }));
    setSelected((prev) => prev?.id === id ? { ...prev, payment_status: "paid" } : prev);
  }

  const vendorLabel = selectedVendors.length === 0
    ? "All Vendors"
    : selectedVendors.length === 1
    ? selectedVendors[0]
    : `${selectedVendors.length} vendors`;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">

          {/* Vendor multiselect */}
          <div className="relative" ref={vendorRef}>
            <button
              onClick={() => setVendorOpen((o) => !o)}
              className={cn(
                "flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors",
                selectedVendors.length > 0
                  ? "border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              )}
            >
              <span>{vendorLabel}</span>
              {selectedVendors.length > 0
                ? <X className="w-3.5 h-3.5 opacity-60" onClick={(e) => { e.stopPropagation(); clearVendors(); }} />
                : <ChevronDown className="w-3.5 h-3.5 opacity-50" />
              }
            </button>
            {vendorOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto py-1">
                  {vendors.map((v) => (
                    <button
                      key={v}
                      onClick={() => toggleVendor(v)}
                      className={cn(
                        "w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                        selectedVendors.includes(v)
                          ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <span className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        selectedVendors.includes(v)
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      )}>
                        {selectedVendors.includes(v) && (
                          <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <select
            value={filters.status}
            onChange={(e) => applyFilter("status", e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || "All Statuses"}</option>
            ))}
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => applyFilter("dateFrom", e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => applyFilter("dateTo", e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={cn("rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden", loading && "opacity-60")}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
              {["Vendor", "Invoice #", "Date", "Due Date", "Amount", "Status"].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.data.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => setSelected(row)}
              >
                <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{row.vendor_name ?? "—"}</td>
                <td className="px-5 py-3.5 text-slate-400 dark:text-slate-500 font-mono text-xs">{row.invoice_number ?? "—"}</td>
                <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{formatDate(row.invoice_date)}</td>
                <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{formatDate(row.due_date)}</td>
                <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{formatCurrency(row.total_amount, row.currency)}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                    row.payment_status === "paid"
                      ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800"
                      : row.payment_status === "overdue"
                      ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800"
                      : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      row.payment_status === "paid" ? "bg-emerald-500"
                      : row.payment_status === "overdue" ? "bg-red-500"
                      : "bg-amber-500"
                    )} />
                    {row.payment_status}
                  </span>
                </td>
              </tr>
            ))}
            {data.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{data.total} records · Page {data.page} of {data.totalPages}</span>
        <div className="flex gap-1">
          <button
            disabled={data.page <= 1}
            onClick={() => goPage(data.page - 1)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={data.page >= data.totalPages}
            onClick={() => goPage(data.page + 1)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <InvoiceDrawer
        invoice={selected}
        onClose={() => setSelected(null)}
        onMarkedPaid={handleMarkedPaid}
      />
    </div>
  );
}
