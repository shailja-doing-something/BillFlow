# SpendSync

Internal dashboard for tracking AI agent infrastructure costs across projects and vendors at Fello Innovations.

## What it does

- **Dashboard** — Live spend metrics with a custom date range picker, vendor breakdown chart, monthly trend chart, and upcoming due invoices
- **Financial Records** — Paginated, filterable table of all invoices from Supabase with mark-as-paid support
- **Projects** — Cards for each AI agent project showing LLMs used, services, and descriptions
- **Tools** — Aggregated view of all LLM providers and external services across projects
- **HubSpot Tickets** — Enrichment ticket tracker with KPI summary and collapsable ticket details
- **Vault** — End-to-end encrypted shared password manager (AES-256-GCM, PBKDF2, zero-knowledge)

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js (App Router), TypeScript |
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
OPENAI_API_KEY=your_openai_key
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
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_BASE_URL=https://spendsync-production.up.railway.app
   OPENAI_API_KEY
   ```
3. App listens on port **8080** (hardcoded in `package.json` start script and `railway.json`)

## Vault

`public/vault.html` — standalone, single-file encrypted password manager at `/vault.html`.

### Full workflow

```
User visits /vault.html
        │
        ▼
┌─────────────────────┐
│   Sign In /         │  Email + password verified by Supabase Auth
│   Create Account    │  Create Account uses /api/vault/register (service role,
└─────────┬───────────┘  no email confirmation needed)
          │
          ▼
┌─────────────────────┐
│  Enter Master       │  All users → "Enter Master Password"
│  Password           │  Admin (shailja.dwivedi@fello.ai) only → "Create Master
└─────────┬───────────┘  Password" if vault is not yet set up
          │
          ▼ (correct master password)
┌─────────────────────┐
│   Vault Unlocked    │  Credentials decrypted in-browser, never sent to server
│   (shared vault)    │  All accounts see the same shared set of entries
└─────────────────────┘
```

### Two-layer security

| Layer | What it does |
|---|---|
| Supabase Auth (email + password) | Proves identity — controls who can reach the vault screen |
| Master Password (AES-256 key) | Controls who can decrypt and read credentials — shared across all users |

Both layers must pass. A valid Supabase account without the master password cannot read any data.

### Encryption details

- Key derivation: **PBKDF2-SHA256**, 310,000 iterations, 32-byte random salt
- Cipher: **AES-256-GCM** with a unique 12-byte IV per field
- Each credential stores: `enc_username`, `iv_username`, `enc_password`, `iv_password`, `enc_url`, `iv_url`, `enc_notes`, `iv_notes`
- Verification: a known plaintext (`billflow-vault-verified`) is encrypted with the master key and stored in `user_settings`. On unlock, it is decrypted to confirm the correct master password was entered
- The master password **never leaves the browser** and is **not stored anywhere**
- Wrong master password attempts are limited to **5** before automatic sign-out

### Adding a new user

1. Go to `/vault.html` → **Create Account** tab
2. Enter the new user's email and a password (min 8 characters)
3. Account is created immediately via `/api/vault/register` (no email confirmation required)
4. Share the master password with the new user out-of-band — they will need it to unlock the vault

### Admin operations

| Task | How |
|---|---|
| Reset a user's login password | Supabase → Authentication → Users → find user → send reset / set new password |
| View registered vault users | Supabase → Table Editor → `vault_members` |
| Change master password | Delete all rows from `vault_entries` and `user_settings`, then set a new master password on next admin login and re-enter credentials |

### Database schema

```sql
-- Vault entries (shared — all authenticated users can read/write)
create table vault_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  service_name text not null,
  category text not null,
  tags text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  enc_username text, iv_username text,
  enc_password text, iv_password text,
  enc_url      text, iv_url      text,
  enc_notes    text, iv_notes    text
);

-- Master password config (one shared row, written by admin only)
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pbkdf2_salt       text not null,
  verification_blob text,
  verification_iv   text
);

-- Vault members log (written by /api/vault/register on account creation)
create table vault_members (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz default now()
);

alter table vault_entries enable row level security;
alter table user_settings enable row level security;
alter table vault_members enable row level security;

-- Shared vault: all authenticated users can access all entries
create policy "shared vault entries" on vault_entries for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Shared master password config: all authenticated users can read
create policy "settings select" on user_settings for select using (auth.role() = 'authenticated');
create policy "settings insert" on user_settings for insert with check (auth.role() = 'authenticated');
create policy "settings update" on user_settings for update using (auth.role() = 'authenticated');
create policy "settings delete" on user_settings for delete using (auth.role() = 'authenticated');

-- Vault members: readable by authenticated, writable by service role only
create policy "members readable by authenticated" on vault_members for select
  using (auth.role() = 'authenticated');
create policy "members insert service role" on vault_members for insert
  with check (true);
```

> **Warning:** The master password cannot be recovered. If lost, all vault data is permanently inaccessible.

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
    hubspot/route.ts          # HubSpot tickets API
    chat/route.ts             # Streaming OpenAI chat
    vault/register/route.ts   # Create vault user (service role, no email confirm)

components/
  dashboard/                  # KPICard, SpendByMonthCard, charts, DashboardChat
  records/                    # RecordsTable, InvoiceDrawer
  projects/                   # ProjectCard
  tools/                      # ToolCard
  hubspot/                    # TicketAccordion, AddTicketModal
  layout/                     # Sidebar
  providers/                  # ThemeProvider, VaultAuthRedirect

lib/
  supabase.ts                 # Supabase client (with placeholder fallbacks for build)
  sheets.ts                   # Static project data
  hubspot.ts                  # Static HubSpot ticket data
  utils.ts                    # formatCurrency, formatDate, cn

public/
  vault.html                  # Standalone vault SPA

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
- BillFlow Vault — end-to-end encrypted shared password manager
  - AES-256-GCM + PBKDF2 (310k iterations) zero-knowledge encryption
  - Shared vault: all authenticated users see the same entries
  - Single shared master password set by admin (shailja.dwivedi@fello.ai)
  - Create Account via `/api/vault/register` (Supabase service role, no email confirmation)
  - Brute-force protection: 5 wrong master password attempts triggers auto sign-out
  - `vault_members` table logs all registered users
  - `VaultAuthRedirect` component handles invite/recovery token redirects

### Initial Release (Feb 2025)
- Dashboard KPI cards, vendor bar chart, monthly area chart
- Financial Records table with pagination, vendor/status/date filters
- Projects page with LLM and service badges
- Tools page with LLM providers and services breakdown
- Upcoming due invoices widget
- Railway deployment with Node 20
