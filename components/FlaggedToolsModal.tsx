"use client";

import { X, AlertTriangle, Ban } from "lucide-react";
import { FlaggedBilledVendor, NeverUsedVendor } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  billedInactive: FlaggedBilledVendor[];
  neverUsed: NeverUsedVendor[];
  onClose: () => void;
}

export function FlaggedToolsModal({ billedInactive, neverUsed, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Flagged Tools</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {billedInactive.length + neverUsed.length} issue{billedInactive.length + neverUsed.length !== 1 ? "s" : ""} detected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6" style={{ scrollbarWidth: "thin" }}>
          {/* Section 1 — Paying but not in active use */}
          {billedInactive.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Paying but not in active use
                </h3>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                  {billedInactive.length}
                </span>
              </div>
              <div className="space-y-2">
                {billedInactive.map((v) => (
                  <div
                    key={v.vendor_name}
                    className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {v.vendor_name}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          Not used in any currently active project
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {v.latest_total_amount != null && (
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatCurrency(v.latest_total_amount)}
                          </p>
                        )}
                        <p className="text-xs text-slate-400">
                          {v.payment_status ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      {v.latest_invoice_date && (
                        <span>Last invoice: {formatDate(v.latest_invoice_date)}</span>
                      )}
                      <span>{v.invoice_count} invoice{v.invoice_count !== 1 ? "s" : ""} in window</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 2 — Never used in any project */}
          {neverUsed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30">
                  <Ban className="w-3.5 h-3.5 text-red-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Never used in any project
                </h3>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                  {neverUsed.length}
                </span>
              </div>
              <div className="space-y-2">
                {neverUsed.map((v) => (
                  <div
                    key={v.vendor_name}
                    className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {v.vendor_name}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                          This tool has never appeared in any project past or present
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white shrink-0">
                        {formatCurrency(v.total_spend)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {billedInactive.length === 0 && neverUsed.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No flagged tools found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
