# Stage 1 app: proposal for approval

**Status:** draft for Xinning's approval. Nothing is built yet.
**Scope:** features 1–6 from the handoff, plus login, Free/Pro plans, card + Pix checkout and the weekly summary email.
**Timeline:** build weeks 3–9, founding users at weeks 10–12 (handoff Part D5).

## 1. What we're building

A mobile-first web app where a Brazilian AI trainer can:

1. **Add platforms:** name, advertised rate (US$/h) and payday.
2. **Track time:** one tap starts a timer, marked as **paid task** or **unpaid** (guidelines, tests, waiting, rework).
3. **Log payments:** dollars received, date, and which work period they cover.
4. **See results:**
   - real hourly rate per platform and project, in reais;
   - unpaid share of their time;
   - "possível diferença" when the money is less than paid hours × rate;
   - late-payment alerts;
   - carnê-leão estimate, a warning near R$ 5 mil in a month, and the DARF deadline.
5. **Disputes:** export a PDF of logged hours and copy a ready-made message in English for platform support.

**Hard rules from the handoff:**
- Only time and money are stored, never task content.
- Tax numbers are always labelled "estimativa".
- Underpayment wording is always "possível diferença, confira no painel da plataforma".

## 2. Screens

| Screen | What's on it | Plan |
|---|---|---|
| Sign in | Email magic link and Google. No passwords. | — |
| Onboarding | Add the first platform (name, rate, payday). About 1 minute. | — |
| Today (home) | Big start/stop timer, paid/unpaid toggle with category chips, today's hours per platform | Free |
| Dashboard | Per platform: real rate (R$/h and US$/h), gap vs. advertised, unpaid share, last 4 weeks | Free (2 platforms) / Pro |
| Time log | List and edit entries, add a missed one manually | Free |
| Payments | Log a payment, see expected vs. received per period, open alerts | Pro for alerts |
| Taxes | Month by month: income in R$ (carnê-leão conversion), estimate, DARF due date | Pro |
| Dispute | Pick platform and period → PDF of hours + English message to copy | Pro |
| Settings | Plan and billing, deductions (INSS, dependents), language, export data, delete account | — |

The app runs on the same Next.js project and domain as the landing page, under `/app`, with the same design tokens. One project and one deploy are simplest for a one-person team.

## 3. Architecture

```
Browser (Next.js pages, mobile-first, installable as an app)
   │  server actions / route handlers
   ▼
Next.js on Vercel ──► Supabase (Postgres + Auth, region São Paulo)
   │                     ▲ Row Level Security: each user sees only their rows
   ├─ /api/billing/webhook ◄── payment provider (card + Pix)
   ├─ /api/cron/daily  ◄── Vercel Cron: PTAX rates, late-payment checks, DARF reminders
   ├─ /api/cron/weekly ◄── Vercel Cron: Monday summary email
   └─ email via Resend (magic links through Supabase SMTP, summaries, reminders)
```

- **Rates:** official BCB PTAX API (Olinda), fetched daily into a `ptax_rates` table. The download code already exists in `bonus/build_carne_leao.py`.
- **Calculations:** one TypeScript module (`src/lib/money/`) with unit tests. It ports the Python tax model from the spreadsheet with the same test cases (R$ 5.000 → 0, R$ 6.000 → 394,54, etc.), so the app and the spreadsheet always agree.
- **Payments:** a small billing adapter, so the provider (still to be decided, see item 3) can change without touching the rest. **Every webhook is stored as-is** in `payment_events`, so Xinning sees every sale independently of the provider's dashboard (handoff B2).

## 4. Data model (Postgres)

All user tables have `user_id` and Row Level Security (`user_id = auth.uid()`).

| Table | Main columns | Notes |
|---|---|---|
| `profiles` | `id` (= auth user), `locale`, `timezone` (default America/Sao_Paulo), `plan` (free/pro), `pro_until` | Created on first sign-in |
| `platforms` | `name`, `listed_rate_usd`, `pay_schedule` (weekly/biweekly/monthly), `pay_weekday` or `pay_day`, `grace_days` (default 2), `archived_at` | Free: up to 2 active |
| `projects` | `platform_id`, `name`, `listed_rate_usd` (optional override), `archived_at` | Pro |
| `time_entries` | `platform_id`, `project_id?`, `kind` (paid/unpaid), `unpaid_category` (guidelines/tests/waiting/rework/other), `started_at`, `ended_at` (null while running), `source` (timer/manual/extension) | One running entry per user (partial unique index). **No free-text field**, so nobody pastes task content. |
| `payments` | `platform_id`, `received_on`, `amount_usd`, `period_start`, `period_end`, `method` (paypal/payoneer/wise/bank/other), `amount_brl_received?` | The period defaults to "since the last payment". BRL received is for Stage 2 (fee loss). |
| `tax_deductions` | `month`, `inss_paid`, `dependents`, `alimony`, `other` | Same inputs as the spreadsheet |
| `alerts` | `type` (late_payment/underpayment/tax_threshold/darf_due), `platform_id?`, `period`, `status` (open/dismissed/resolved), `data` (jsonb), `notified_at` | Shown in the app, some also emailed |
| `ptax_rates` | `date` (PK), `buy`, `sell` | Shared, read-only for users |
| `subscriptions` | `provider`, `provider_customer_id`, `provider_subscription_id`, `plan` (pro_monthly/pro_yearly/founding), `status`, `current_period_end` | Drives `profiles.plan` |
| `payment_events` | `provider`, `event_id` (unique), `type`, `user_id?`, `amount`, `currency`, `raw` (jsonb), `received_at` | Every webhook, never edited |
| `email_log` | `type`, `ref`, `sent_at` | Prevents duplicate reminders |

## 5. How the main features work

1. **Timer (feature 1).** Start creates a `time_entries` row with `ended_at = null` on the server, so it survives closing the tab or switching phones. Switching paid ↔ unpaid ends the current entry and starts a new one. Entries over 12 h ask for confirmation.
2. **Real rate (feature 2).**
   - **Formula:** payments in a period ÷ (paid + unpaid hours in the same period), using the handoff formulas.
   - **Reais:** converted at the PTAX rate of the payment date.
   - **Per project:** Pro, using the project's rate if it has one.
3. **Underpayment (feature 3).**
   - **Formula:** for each payment, paid hours in its period × advertised rate − amount received.
   - **When it's flagged:** only above a tolerance, proposed at the larger of US$ 2 or 3%, adjustable.
   - **Wording:** always "possível diferença, confira no painel da plataforma".
4. **Late payment (feature 4).** The daily job computes each platform's expected payday from its schedule. If no payment is logged by payday + grace days, it opens an alert and emails the user once.
5. **Taxes (feature 5).**
   - **Conversion:** monthly income uses the carnê-leão rule (PTAX buying rate, last business day of the 1st half of the previous month).
   - **Estimate:** the 2026 table, the R$ 607,20 simplified discount or legal deductions (whichever is larger), the Lei 15.270 reduction, and DARFs under R$ 10 carried to the next month. All of this exists in the spreadsheet model.
   - **R$ 5 mil alert:** when the month passes R$ 4.000.
   - **DARF reminders:** emailed 5 days and 1 day before the due date.
6. **PDF + dispute message (feature 6).**
   - **The PDF** (server-side, `@react-pdf/renderer`) contains: platform, period, each entry (date, start, end, duration, paid/unpaid), totals, advertised rate, expected vs. received.
   - **The message** is an English template filled with the numbers and a polite request to review, with a copy button. It never says "you were cheated".
7. **Weekly summary.** Monday morning email: hours, real rate per platform, unpaid share, open alerts. Free and Pro.

## 6. Plans and billing

- **Free:** timer, up to 2 active platforms, real rate in reais, weekly summary.
- **Pro (R$ 14,90/month or R$ 129/year):** unlimited platforms, projects, full history, alerts, taxes, PDF/dispute.
- **Founding offer (R$ 99):** a one-time payment that sets `pro_until` = launch date + 1 year, with no auto-renewal surprise. Before it ends, we email an offer to continue at the yearly price.
- **Where limits are checked:** on the server, in actions and route handlers. The UI only hides buttons.
- **Checkout:** the provider's hosted checkout (card + Pix), so no card data ever touches our servers.

## 7. Privacy and LGPD

- Row Level Security on every user table. The service key is used only in cron jobs and webhooks.
- Database in São Paulo (`sa-east-1`). Daily backups on the paid plan.
- **Export:** one button downloads all of a user's data (JSON + CSV).
- **Delete account:** removes all of the user's rows. Payment records needed for taxes and accounting are anonymized, not kept with the user.
- No analytics inside the app beyond counting key events (signup, first timer, first payment).

## 8. Build plan

| Week | Deliverable |
|---|---|
| 3 | Supabase project, auth (magic link + Google), schema + RLS, app shell, platforms CRUD |
| 4 | Timer, time log, manual entries; dashboard with real rate (features 1–2) |
| 5 | Payments, PTAX job, BRL conversion; underpayment detector (3) |
| 6 | Late-payment alerts (4); email setup; weekly summary |
| 7 | Taxes: estimate, R$ 5 mil alert, DARF reminders (5) |
| 8 | PDF + dispute message (6); checkout + webhooks for the founding sale |
| 9 | Export/delete, QA on real phones, fixes; invite founding users |

Each week ends with a deploy you can click through, plus unit tests for every calculation.

## 9. Running costs (to confirm when we choose)

| Service | Free tier | When to pay |
|---|---|---|
| Vercel | Hobby (non-commercial use only) | Before launch: Pro, about US$ 20/month |
| Supabase | Free (projects pause after a week without activity; no daily backups) | At launch: Pro, about US$ 25/month |
| Resend | Free tier with a daily sending cap | When the Monday summary exceeds the cap |
| Payment provider | No monthly fee expected; % per sale | — (see item 3) |

These prices are from memory. I'll check the current numbers before you decide.

## 10. Decisions needed from Xinning

1. **Approve this plan,** or tell me what to change.
2. **App language at launch:** PT-BR only, or PT-BR + English? The site is already bilingual; the app can reuse the same setup. My recommendation: build with translations from day 1, ship in PT-BR, add English when you want.
3. **Payment provider:** the comparison is coming next (item 3). Gabriel opens the account.
4. **Email for the app:** Resend (handoff suggestion), or Brevo for everything to keep one account fewer. My recommendation: Resend for app emails, Brevo for the marketing list.
5. **Paid plans at launch:** Vercel Pro and Supabase Pro, about US$ 45/month together.
