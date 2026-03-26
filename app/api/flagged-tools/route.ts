import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { FlaggedBilledVendor, NeverUsedVendor } from "@/types";

export async function GET() {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [projectsRes, billedRes, allRecordsRes] = await Promise.all([
    supabase
      .from("agents_portfolio")
      .select("llms, llm_accounts, services_used, status"),
    supabase
      .from("financial_records")
      .select("vendor_name, total_amount, payment_status, invoice_date, due_date")
      .or(`payment_status.eq.pending,invoice_date.gte.${sixtyDaysAgo}`)
      .not("vendor_name", "is", null)
      .not("vendor_name", "ilike", "%makemytrip%"),
    supabase
      .from("financial_records")
      .select("vendor_name, total_amount")
      .not("vendor_name", "is", null)
      .not("vendor_name", "ilike", "%makemytrip%"),
  ]);

  const allProjects = projectsRes.data ?? [];
  const activeProjects = allProjects.filter((p: any) => p.status !== "shut down");

  // Extract all tool/vendor names from a project set as lowercase strings.
  // Matches the actual DB schema: llms, llm_accounts, services_used are comma-separated text.
  function extractTools(projects: any[]): string[] {
    const tools: string[] = [];
    for (const project of projects) {
      for (const field of ["llms", "llm_accounts", "services_used"]) {
        if (project[field]) {
          (project[field] as string).split(",").forEach((t) => {
            const clean = t.trim().toLowerCase();
            if (clean && clean !== "na" && clean !== "n/a" && clean !== "-") {
              tools.push(clean);
            }
          });
        }
      }
    }
    return tools;
  }

  const toolsInAnyProject = extractTools(allProjects);
  const toolsInActiveProjects = extractTools(activeProjects);

  const fuzzyMatch = (vendorKey: string, toolList: string[]): boolean =>
    toolList.some((t) => t.includes(vendorKey) || vendorKey.includes(t));

  // ── Flag Type 1: recently billed/pending but not in any active project ────
  type VendorEntry = FlaggedBilledVendor & { _key: string };
  const vendorMap = new Map<string, VendorEntry>();

  for (const r of billedRes.data ?? []) {
    const key = (r.vendor_name as string).toLowerCase().trim();
    if (!vendorMap.has(key)) {
      vendorMap.set(key, {
        _key: key,
        vendor_name: r.vendor_name,
        latest_invoice_date: r.invoice_date,
        latest_total_amount: r.total_amount != null ? Number(r.total_amount) : null,
        payment_status: r.payment_status,
        invoice_count: 0,
      });
    }
    const entry = vendorMap.get(key)!;
    entry.invoice_count++;
    // Track most-recent invoice
    if (
      r.invoice_date &&
      (!entry.latest_invoice_date || r.invoice_date > entry.latest_invoice_date)
    ) {
      entry.latest_invoice_date = r.invoice_date;
      entry.latest_total_amount = r.total_amount != null ? Number(r.total_amount) : null;
      entry.payment_status = r.payment_status;
    }
  }

  const billedInactive: FlaggedBilledVendor[] = [];
  for (const [key, entry] of vendorMap.entries()) {
    if (!fuzzyMatch(key, toolsInActiveProjects)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _key, ...vendor } = entry;
      billedInactive.push(vendor);
    }
  }

  // ── Flag Type 2: appears in financial_records but never in any project ────
  const allVendorMap = new Map<string, { vendor_name: string; total_spend: number }>();
  for (const r of allRecordsRes.data ?? []) {
    const key = (r.vendor_name as string).toLowerCase().trim();
    if (!allVendorMap.has(key)) {
      allVendorMap.set(key, { vendor_name: r.vendor_name, total_spend: 0 });
    }
    allVendorMap.get(key)!.total_spend += Number(r.total_amount ?? 0);
  }

  const neverUsed: NeverUsedVendor[] = [];
  for (const [key, entry] of allVendorMap.entries()) {
    if (!fuzzyMatch(key, toolsInAnyProject)) {
      neverUsed.push(entry);
    }
  }

  return NextResponse.json({ billedInactive, neverUsed });
}
