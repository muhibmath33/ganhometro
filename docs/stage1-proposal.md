# Stage 1 app: plan

**Status:** approved by Xinning on 27 Oct 2026, with the general design from [audience-expansion.md](audience-expansion.md).
**Progress:** build weeks 3 and 4 are done (sign-in, platforms, timer, time log, dashboard with the real rate), running on a local Supabase.
Google sign-in waits for a Google Cloud OAuth setup. Next: payments, PTAX job, underpayment (week 5).
**Scope:** features 1–6 from the handoff, plus login, Free/Pro plans, card + Pix checkout and the weekly summary email.
**Timeline:** build weeks 3–9, founding users at weeks 10–12 (handoff Part D5).

## 1. What we're building

A mobile-first web app where a Brazilian AI trainer can do the following. It's built general from day one, so freelancers and online tutors paid in dollars can be added later with copy and a few features, not a rebuild.

1. **Add income sources:** a *platform* (Mercor, Outlier, Upwork, Cambly…) or a *client*. For each one: the pay model (**hourly, per task/video, or fixed-price project**), the rate, the currency (USD, EUR, GBP or BRL), the platform commission if any, and when it pays.
2. **Track time:** one tap starts a timer, marked as **paid** or **unpaid**. Unpaid categories are preset per type of work and editable: guidelines, tests, waiting and rework for AI trainers; proposals, calls and revisions for freelancers; waiting for students for tutors. Per-task work can also record how many tasks or videos were done.
3. **Log payments:** amount and currency received, date, which work period (or project) they cover, and when they were expected.
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
| Onboarding | "What do you do?" (preselects categories), then add the first platform or client (name, pay model, rate, payday). About 1 minute. | — |
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
| `profiles` | `id` (= auth user), `locale`, `timezone` (default America/Sao_Paulo), `work_type` (ai/freelancer/teacher/creator/other), `plan` (free/pro), `pro_until` | Created on first sign-in |
| `income_sources` | `kind` (platform/client), `name`, `pay_model` (hourly/per_task/fixed), `rate` (per hour or per task), `currency` (USD/EUR/GBP/BRL), `commission_pct?`, `pay_schedule` (weekly/biweekly/monthly/on_invoice), `pay_weekday` or `pay_day` or `payment_terms_days`, `grace_days` (default 2), `archived_at` | Free: up to 2 active |
| `projects` | `source_id`, `name`, `pay_model?` and `rate?` (override), `fixed_price?` (for fixed-price projects), `archived_at` | Pro |
| `categories` | `kind` (paid/unpaid), `name`, `preset` (guidelines, tests, waiting, rework, proposals, calls, revisions, admin…), `archived_at` | Presets by work type; users can rename or add |
| `time_entries` | `source_id`, `project_id?`, `kind` (paid/unpaid), `category_id?`, `units?` (tasks/videos, for per-task pay), `started_at`, `ended_at` (null while running), `origin` (timer/manual/extension) | One running entry per user (partial unique index). **No free-text field**, so nobody pastes task content. |
| `payments` | `source_id`, `project_id?`, `expected_on?`, `received_on`, `amount`, `currency`, `period_start`, `period_end`, `method` (paypal/payoneer/wise/airtm/bank/pix/other), `amount_brl_received?` | The period defaults to "since the last payment". Amounts in EUR/GBP convert to USD on the receipt date, then to BRL (carnê-leão rule). BRL received feeds the fee-loss tracker. |
| `tax_deductions` | `month`, `inss_paid`, `dependents`, `alimony`, `other` | Same inputs as the spreadsheet |
| `alerts` | `type` (late_payment/underpayment/tax_threshold/darf_due), `source_id?`, `period`, `status` (open/dismissed/resolved), `data` (jsonb), `notified_at` | Shown in the app, some also emailed |
| `ptax_rates` | `date` (PK), `buy`, `sell` | Shared, read-only for users |
| `subscriptions` | `provider`, `provider_customer_id`, `provider_subscription_id`, `plan` (pro_monthly/pro_yearly/founding), `status`, `current_period_end` | Drives `profiles.plan` |
| `payment_events` | `provider`, `event_id` (unique), `type`, `user_id?`, `amount`, `currency`, `raw` (jsonb), `received_at` | Every webhook, never edited |
| `email_log` | `type`, `ref`, `sent_at` | Prevents duplicate reminders |
| `team_members` | `user_id`, `role` (owner/finance/marketing) | Who can open the admin area |
| `admin_audit_log` | `actor_id`, `action`, `target`, `data` (jsonb), `created_at` | Every admin action |

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

## 7. Admin area (for the team)

The waitlist dashboard already exists at `/admin` (password login, data from Brevo). With the app, it grows into a full admin area at `/admin`, using the same login as the app plus a role check.

| Section | What it shows | Actions |
|---|---|---|
| Overview | Signups, users (total and active this week), Free vs. Pro, revenue this month, **founding sales vs. the 50-sale goal** | — |
| Sales | Every stored payment event: paid, renewed, failed, refunded; totals by plan | Mark a refund as handled |
| Users | Search by email: plan, signup date, last active, number of platforms | Grant or extend Pro (founding buyers); start an LGPD export or deletion |
| Marketing | Signups and sales by channel, campaign and creator | Export a payout report (creators, marketer's R$ 10 per founding sale) |
| System | Last PTAX update, daily/weekly job runs, emails sent and bounced | Re-run a failed job |

- **Privacy:** the admin never shows a user's earnings, payments or time entries. The team doesn't need them, and the privacy promise stays true. Only counts and account details.
- **Roles:**
  - `owner` (Xinning): everything.
  - `finance` (Gabriel): overview and sales.
  - `marketing` (the marketer): overview and marketing.
- **Action log:** every admin action is recorded (who, what, when).

## 8. Privacy and LGPD

- Row Level Security on every user table. The service key is used only in cron jobs and webhooks.
- Database in São Paulo (`sa-east-1`). Daily backups on the paid plan.
- **Export:** one button downloads all of a user's data (JSON + CSV).
- **Delete account:** removes all of the user's rows. Payment records needed for taxes and accounting are anonymized, not kept with the user.
- No analytics inside the app beyond counting key events (signup, first timer, first payment).

## 9. Build plan

| Week | Deliverable |
|---|---|
| 3 | Supabase project, auth (magic link + Google), schema + RLS, app shell, platforms CRUD |
| 4 | Timer, time log, manual entries; dashboard with real rate (features 1–2) |
| 5 | Payments, PTAX job, BRL conversion; underpayment detector (3) |
| 6 | Late-payment alerts (4); email setup; weekly summary |
| 7 | Taxes: estimate, R$ 5 mil alert, DARF reminders (5) |
| 8 | PDF + dispute message (6); checkout + webhooks for the founding sale |
| 9 | Admin area (overview, sales, users, marketing, system, roles); export/delete; QA on real phones; invite founding users |

Each week ends with a deploy you can click through, plus unit tests for every calculation.

## 10. Running costs (to confirm when we choose)

| Service | Free tier | When to pay |
|---|---|---|
| Vercel | Hobby (non-commercial use only) | Before launch: Pro, about US$ 20/month |
| Supabase | Free (projects pause after a week without activity; no daily backups) | At launch: Pro, about US$ 25/month |
| Resend | Free tier with a daily sending cap | When the Monday summary exceeds the cap |
| Payment provider | No monthly fee expected; % per sale | — (see item 3) |

These prices are from memory. I'll check the current numbers before you decide.

## 11. Decisions (approved 27 Oct 2026)

1. **Plan:** approved, with the general design (platforms or clients; hourly, per-task or fixed-price pay; any currency; editable categories).
2. **Language:** built with translations from day 1 (same setup as the site), launching in PT-BR; English when wanted.
3. **Payment provider:** Mercado Pago ([payment-providers.md](payment-providers.md)). Gabriel opens the account and adds Xinning as a collaborator. Needed by week 8.
4. **Email:** Resend for app emails, Brevo for the marketing list.
5. **Admin roles:** owner (Xinning), finance (Gabriel), marketing (the marketer).
6. **Paid plans:** move to Vercel Pro and Supabase Pro at launch (about US$ 45/month). Develop on free tiers and on this computer until then.
7. **Analytics:** Umami Cloud (free, cookieless) on the site.
