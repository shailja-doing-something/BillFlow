# SpendSync

Internal dashboard for tracking AI agent infrastructure costs across projects and vendors at Fello Innovations.

## What it does

- **Dashboard** — Live spend metrics with a custom date range picker, vendor breakdown chart, monthly trend chart, and upcoming due invoices
- **Financial Records** — Paginated, filterable table of all invoices from Supabase with mark-as-paid support
- **Projects** — Cards for each AI agent project showing LLMs used, services, and descriptions
- **Tools** — Aggregated view of all LLM providers and external services across projects
- **HubSpot Tickets** — Enrichment ticket tracker with KPI summary and collapsable ticket details

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS, Shadcn UI |
| Charts | Recharts |
| Database | Supabase (PostgreSQL) |
| Static data | Hardcoded from `AI Agents Portfolio.xlsx` |
| Deployment | Railway |

## Local Development

**Prerequisites**: Node 20+

```bash
npm install
```

Create `.env.local`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

App runs at `http://localhost:3000`.

> Note: `NEXT_PUBLIC_BASE_URL` is not needed locally. It is only required in Railway so server components can self-fetch API routes.

## Deployment (Railway)

1. Push to `main` on GitHub — Railway auto-deploys
2. Required environment variables in Railway:
   ```
   SUPABASE_URL
   SUPABASE_ANON_KEY
   NEXT_PUBLIC_BASE_URL=https://spendsync-production.up.railway.app
   ```
3. App listens on port **8080** (hardcoded in `package.json` start script and `railway.json`)

## Project Structure

```
app/
  page.tsx                    # Dashboard
  records/page.tsx            # Financial Records
  projects/page.tsx           # Projects
  tools/page.tsx              # Tools
  hubspot/page.tsx            # HubSpot Tickets
  api/
    dashboard/route.ts        # KPI + chart data
    dashboard/range/route.ts  # Custom date range breakdown
    invoices/route.ts         # Paginated invoices
    invoices/[id]/paid/       # Mark as paid
    invoices/vendors/         # Vendor list
    sheets/route.ts           # Projects API
    tools/route.ts            # Tools API

components/
  dashboard/                  # KPICard, SpendByMonthCard, charts
  records/                    # RecordsTable, InvoiceDrawer
  projects/                   # ProjectCard
  tools/                      # ToolCard
  hubspot/                    # TicketAccordion
  layout/                     # Sidebar
  providers/                  # ThemeProvider

lib/
  supabase.ts                 # Supabase client
  sheets.ts                   # Static project data
  hubspot.ts                  # Static HubSpot ticket data
  utils.ts                    # formatCurrency, formatDate, cn

types/index.ts                # All TypeScript interfaces
```

## Data Sources

### Supabase — `financial_records` table
Live invoice data. Key columns: `vendor_name`, `invoice_date`, `due_date`, `total_amount`, `payment_status`, `currency`.

All queries exclude MakemyTrip invoices automatically.

### Static xlsx data
Projects and HubSpot tickets are hardcoded in `lib/sheets.ts` and `lib/hubspot.ts`. Update these files manually when the source spreadsheet (`AI Agents Portfolio.xlsx`) changes.

## Feature Changelog

### March 2026
- Custom date range spend card with calendar picker and paid/unpaid/upcoming breakdown
- Fixed vendor chart (was querying current year only — now last 12 months)
- Fixed monthly trend chart (was showing paid-only totals — now all invoices)
- HubSpot Tickets page with enrichment summary and collapsable ticket list
- Dark/light mode support across all pages

### Initial Release (Feb 2025)
- Dashboard KPI cards, vendor bar chart, monthly area chart
- Financial Records table with pagination, vendor/status/date filters
- Projects page with LLM and service badges
- Tools page with LLM providers and services breakdown
- Upcoming due invoices widget
- Railway deployment with Node 20
