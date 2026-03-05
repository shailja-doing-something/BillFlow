# SpendSync — Claude Instructions

## Project Overview
Internal web app for Fello Innovations to track AI agent costs across projects and vendors.
No authentication required. Deployed on Railway.

## Tech Stack
- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS, Shadcn UI primitives
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL) — `financial_records` table
- **Static data**: `lib/sheets.ts` (projects), `lib/hubspot.ts` (HubSpot tickets) — hardcoded from xlsx
- **Deployment**: Railway (port 8080), GitHub repo: `FelloInnovations/SpendSync`

## Key Conventions

### Data sources
- **Live data** comes from Supabase via `lib/supabase.ts` — never query directly, always use the `supabase` client
- **Static data** (Projects, Tools, HubSpot) is hardcoded in `lib/sheets.ts` and `lib/hubspot.ts` — update these files manually when the xlsx changes
- **Always exclude MakemyTrip** from all Supabase queries: `.not("vendor_name", "ilike", "%makemytrip%")`

### API routes
| Route | Purpose |
|---|---|
| `GET /api/dashboard` | KPI cards + charts data (last 12 months) |
| `GET /api/dashboard/range?from=&to=` | Custom date range breakdown (paid/unpaid/upcoming) |
| `GET /api/invoices` | Paginated invoice table with filters |
| `GET /api/invoices/vendors` | Unique vendor list for filter dropdown |
| `PATCH /api/invoices/[id]/paid` | Mark invoice as paid |
| `GET /api/sheets` | Projects + spend map from static data |
| `GET /api/tools` | Tools/vendors aggregated from static data |

### Self-fetch pattern
Server components fetch their own API routes. The base URL must be set:
```
NEXT_PUBLIC_BASE_URL=https://spendsync-production.up.railway.app
```
Without this, server components fall back to `http://localhost:3000` which fails on Railway (app runs on port 8080). All server component fetches are wrapped in try/catch returning empty data on failure.

### Component structure
```
components/
  dashboard/    — KPICard, SpendByMonthCard (range picker), SpendByVendorChart, MonthlyTrendChart
  records/      — RecordsTable, InvoiceDrawer
  projects/     — ProjectCard
  tools/        — ToolCard
  hubspot/      — TicketAccordion
  layout/       — Sidebar
  providers/    — ThemeProvider
```

### Adding a new page
1. Create `app/<name>/page.tsx` (server component with try/catch)
2. Add to `NAV` array in `components/layout/Sidebar.tsx`
3. Add icon import from `lucide-react`

### Styling rules
- Card pattern: `rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm`
- Accent colors: indigo (spend/primary), amber (unpaid/warning), rose (overdue/danger), emerald (done/success)
- Always support dark mode with `dark:` variants

## Environment Variables
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_BASE_URL=https://spendsync-production.up.railway.app
```

## Deployment
- Push to `main` on GitHub → Railway auto-deploys
- Node >=20.9.0 required (`.nvmrc` set to `20`)
- Start command: `next start -p 8080` (set in both `package.json` and `railway.json`)
- Port 8080 is hardcoded (Railway assigns 8080)

## Feature Log
<!-- Append new features here as they are added -->

### 2025-02 (Initial build)
- Dashboard with KPI cards, vendor chart, monthly trend chart, upcoming due invoices
- Financial Records page with paginated table, filters, mark-as-paid
- Projects page from static xlsx data
- Tools page from static xlsx data

### 2026-03
- **HubSpot Tickets page** — summary KPI cards + collapsable accordion, clickable links, hit rate color coding
- **Date range spend card** — replaced static "Last Month's Spend" with custom date picker (From/To), shows paid total with expandable paid/unpaid/upcoming breakdown
- **Fixed vendor chart** — was querying from Jan 1 current year (empty); now queries last 12 months
- **Fixed monthly trend** — was showing paid-only; now shows all invoices (paid + unpaid)
- **Monthly trend split** — API now returns paid/unpaid/overdue breakdown per month
