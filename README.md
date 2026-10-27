# Ganhômetro

The waitlist site for Ganhômetro, in Brazilian Portuguese (`/`) and English (`/en`), with a PT/EN switch in the navbar.
Next.js 16 (App Router) + Tailwind CSS 4, deployed on Vercel.
Signups go to a Brevo list, and analytics use Umami Cloud (free, no cookies).
There's also a second landing page for freelancers paid in dollars at `/freelancers` (and `/en/freelancers`), built around "how much is really left in reais" ([docs/freelancer-market.md](docs/freelancer-market.md)).
Free calculators live at `/calculadoras` (and `/en/calculators`): take-home pay, individual or company (PF ou CNPJ), and this month's carnê-leão.

The app itself lives under `/app` and is being built week by week, following `docs/stage1-proposal.md`.
It uses Supabase (Postgres + sign-in by emailed code). Done so far: sign-in, onboarding, platforms and clients (with the Free plan's limit of 2), settings,
the timer (paid/unpaid, categories), the time log with manual entries, the dashboard with the real hourly rate,
payments (quick add, or import a Wise, Payoneer or Upwork CSV statement), "possível diferença" on short payments,
the month's take-home ("Quanto sobra") as an individual or a company, the tax settings, and Taxes: the carnê-leão
month by month (or the company's DAS), each payment's conversion, deductions, "paid", reminders, the R$ 5 mil warning
and the PF-or-CNPJ comparison over the last 12 months. Also: reserves (a salary to pay yourself, plus 13º, vacation and
an emergency fund), late-payment alerts, and emails (DARF/DAS reminders 5 days and 1 day before, late payments, a Monday
summary).

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional locally
npm run dev                  # http://localhost:3000
```

Without Brevo keys, the form still works locally. The signup is printed in the terminal instead of being saved.
In production, a missing key makes the form show an error, so a misconfigured deploy can't silently lose signups.

Checks: `npm run lint`, `npm test` (unit tests for the calculations, Node's built-in test runner) and `npm run build`.

After changing a color in the `@theme` block of `src/app/globals.css`, restart `npm run dev`: the running dev server doesn't always pick it up.

### The app (`/app`) locally

The app needs a local Supabase, which runs in Docker (install Docker Desktop first):

```bash
npx supabase start    # first run downloads the images; applies supabase/migrations
```

It prints an **API URL**, a **Publishable key** and a **Secret key**. Put them in `.env.local` as
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` (the secret key lets the
server store exchange rates), add any long random `CRON_SECRET`, then restart `npm run dev`.

- Sign-in emails don't leave your computer. Open the local inbox at http://127.0.0.1:54324 to read the code.
- `npx supabase db reset` wipes the local database and re-applies the migrations.
- After changing a migration, regenerate the types:
  `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`.
- Exchange rates fill in by themselves when a page needs them. To run the jobs by hand:
  `curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/daily` (rates, reminders, late
  payments) and `…/api/cron/weekly` (the Monday summary).
- App emails go to the same local inbox when `.env.local` has `MAILPIT_URL=http://127.0.0.1:54324`. Each email is
  logged in `email_log`, so a job run twice doesn't send it twice.
- Turbopack can keep an old copy of a shared module for route handlers (PDF downloads, cron jobs). If a download
  disagrees with the pages after a change, stop `npm run dev` (the `next` process too) and start it again.
- `npx supabase stop` shuts it down. Changes to `supabase/config.toml` or the email template only apply after a stop and start.

## What's where

| Path | What it is |
|---|---|
| `src/components/LandingPage.tsx` | The landing page (all sections, in design order), used by both languages |
| `src/app/page.tsx`, `src/app/en/page.tsx` | Portuguese (`/`) and English (`/en`) home pages |
| `src/i18n/` | All page text: `pt.ts` (Portuguese, the original copy) and `en.ts` (English), plus the URL of each page per language |
| `src/components/Calculator.tsx` | Real hourly rate calculator (client) |
| `src/app/calculadoras`, `src/app/en/calculators` | Free calculator pages (take-home, PF ou CNPJ, carnê-leão) and their index |
| `src/components/calculators/`, `src/i18n/calculators.ts` | The calculators and their text (PT/EN) |
| `src/lib/money/tax.ts` | 2026 tax rules: carnê-leão, INSS, Simples Nacional on exports, PF vs. CNPJ, DARF due dates (with tests) |
| `src/components/NetExampleCard.tsx`, `src/components/FeatureVotes.tsx` | `/freelancers` hero example and the "what do you want first?" vote |
| `src/lib/calc.ts` | Calculator formulas and Brazilian number parsing, ported 1:1 from the design |
| `src/components/WaitlistForm.tsx` | Email form with LGPD consent, honeypot, thank-you state |
| `src/app/api/subscribe/route.ts` | Server route that adds the contact to Brevo |
| `src/lib/utm.ts` | Remembers `utm_*` from the landing URL and sends them with the signup |
| `src/lib/site.ts` | Site name, URL, contact email, data controller |
| `src/app/privacidade`, `src/app/termos`, `src/app/en/privacy`, `src/app/en/terms` | Privacy policy (LGPD) and terms, in Portuguese and English |
| `src/app/opengraph-image.tsx` | Link preview image for WhatsApp, Instagram and others |
| `bonus/` | Scripts that build and verify the carnê-leão spreadsheet, the PDF guide (`build_guide.py`), and the BCB rates (`ptax.json`) |
| `src/app/admin`, `src/components/admin`, `src/lib/admin` | Private waitlist dashboard and CSV export |
| `src/app/app/` | The app: `page.tsx` (Today, with the timer), `painel` (dashboard), `registro` (time log), `fontes` (platforms and clients), `ajustes` (settings), `entrar` (sign in), `boas-vindas` (onboarding), `auth/confirm` (email link) |
| `src/app/app/pagamentos/` | Payments: list and quick add, edit, `importar` (statement import) and `custos` (exchange and fee audit by method) |
| `src/app/app/plano/`, `src/app/fundador/`, `src/app/en/founding/` | Plan and billing page; the public founding offer page |
| `src/lib/billing/` | Plans and prices, Mercado Pago API, and processing payments and subscriptions (`process.ts`) |
| `src/app/api/mercadopago/webhook/` | Mercado Pago notifications (signature checked) |
| `src/app/app/registro/importar` | Import hours from Toggl or Clockify (CSV read in the browser; descriptions never leave it) |
| `src/app/app/faturas/` | Invoices: what's owed, new invoice (amount from logged hours), each invoice with its payments |
| `src/app/app/fontes/[id]` | A platform or client, and its projects (same pay, own hourly rate, or fixed price) |
| `src/app/app/documentos/` | Documents: income statement, DECORE pack, timesheet, and `revisao` (payment review request with the math and a message to copy) |
| `src/app/app/arquivos/` | Downloads: `comprovante` (income statement PDF), `pagamentos` (CSV for the accountant), `horas` (timesheet or review PDF), `fatura/[id]` (invoice PDF) |
| `src/lib/documents/`, `src/i18n/documents.ts` | The PDFs (`@react-pdf/renderer`), their data, number formats per language, the messages to copy, and their text (PT/EN, chosen per document) |
| `src/app/app/impostos/` | Taxes: the year, and each month (`2026-10`) with conversions, deductions and "paid" |
| `src/app/app/actions.ts` | Every form in the app (server actions) |
| `src/components/app/`, `src/i18n/app.ts` | App screens' building blocks, and all app text (PT/EN) |
| `src/lib/app/` | Signed-in user and profile (`session.ts`), form rules (`sources.ts`, `entries.ts`, `payments.ts`), time zones (`time.ts`), statement reader (`statementImport.ts`), Toggl/Clockify reader (`timeImport.ts`), payments in reais for pages (`money.ts`), the Taxes screens' data and reminders (`taxes.ts`), late payments (`alerts.ts`), projects (`projects.ts`), invoices and money owed (`invoices.ts`) |
| `src/lib/money/` | Real rate with projects and retainers (`realRate.ts`), invoice states and numbering (`invoices.ts`), income report, timesheet rows and CSV (`reports.ts`), exchange and fee audit (`fees.ts`), money received, "possível diferença" and take-home (`received.ts`), reserves (`reserves.ts`), paydays and late payments (`paydays.ts`), conversion rules (`convert.ts`), taxes (`tax.ts`), Banco Central rates (`ptax.ts`, `rates.ts`); all with tests except the network parts |
| `src/app/api/cron/`, `vercel.json` | Daily job (17:30 UTC: rates, then reminder, late-payment and overdue-invoice emails) and weekly job (Mondays 11:00 UTC: summary) |
| `src/lib/jobs/notifications.ts` | What the jobs send and to whom (each email once, respecting the person's email settings) |
| `src/lib/email/`, `src/i18n/emails.ts` | Sending (Resend, or the local inbox), the email templates and their text (PT/EN) |
| `src/lib/supabase/admin.ts` | Server-only client with the secret key, for the shared rates table |
| `src/lib/supabase/`, `src/proxy.ts` | Supabase client, generated database types, session refresh for `/app` |
| `supabase/migrations/` | Database tables, security rules (each user sees only their own rows), the Free plan limit, and no overlapping time entries |
| `supabase/templates/magic_link.html` | The sign-in email (PT/EN), with the 6-digit code and a link |
| `docs/stage1-proposal.md` | Stage 1 app plan (screens, data model, architecture), approved 27 Oct 2026 |
| `docs/research/interview-script.md` | Interview script (EN, with a PT version for Gabriel) to check the freelancer research |
| `docs/partnership-checklist.md` | What Xinning and Gabriel should agree in writing, plus questions for the accountant and lawyer |
| `docs/success-and-competition.md` | Competitors in Brazil, odds of success, unit economics, risks and signals to watch |
| `docs/freelancer-market.md` | Brazilian freelancers paid from abroad: what they want, competitors, where the gap is, and the proposal |
| `docs/audience-expansion.md` | Which audiences to add after AI trainers, in what order, and how to test them |
| `docs/market-sizing.md` | Target audience size: AI trainers in Brazil (estimates, sources, implications) |
| `docs/payment-providers.md` | Payment provider comparison and recommendation |
| `docs/marketing/` | Workana job post, marketer brief and creator partnership messages (PT-BR) |
| `docs/emails/brevo-emails.md` | Confirmation and welcome emails (PT/EN) and Brevo automation steps |
| `public/Carne-leao-2026-Ganhometro.xlsx` | The signup bonus, generated by `bonus/build_carne_leao.py` |

## Setup

**Who owns what.** Xinning owns the GitHub, Vercel, Brevo and Umami accounts. Gabriel, the Brazilian
partner, handles anything that needs a Brazilian ID. For this site, that's the `ganhometro.com.br` domain,
bought at registro.br with his CPF. The marketer gets access to accounts, never ownership.

### 1. Brevo

1. Create a contact list named **"Waitlist"** and note its **ID** → `BREVO_LIST_ID`.
2. Create an API key (SMTP & API → API keys) → `BREVO_API_KEY`.
3. Contacts → Settings → Contact attributes: create these **Text** attributes:
   `SIGNUP_SOURCE`, `CONSENT_AT`, `LANGUAGE`, `LANDING_PAGE`, `WORK_TYPE`, `RECEIVE_AS`, `INCOME_RANGE`, `UTM_SOURCE`, `UTM_MEDIUM`, `UTM_CAMPAIGN`, `UTM_CONTENT`, `UTM_TERM`.
   They hold the LGPD consent record and the campaign that brought each signup. `LANGUAGE` (`pt-BR` or `en`) lets you email people in their language.
   `RECEIVE_AS` (`pf`, `cnpj` or `unknown`) and `INCOME_RANGE` are optional answers asked on `/freelancers` and the calculators.
   If they are missing, the route still saves the email, but without this data.
4. Recommended: turn on double opt-in. Create a "double opt-in" template in Brevo, then set
   `BREVO_DOI_TEMPLATE_ID` and `BREVO_DOI_REDIRECT_URL` (for example `https://ganhometro.com.br/?confirmado=1`).
   For English signups, also set `BREVO_DOI_TEMPLATE_ID_EN`. The thank-you message then asks people to confirm by email.
   Ready-to-paste email texts (PT and EN) and the automation steps are in `docs/emails/brevo-emails.md`.
5. Authenticate the sending domain in Brevo (SPF/DKIM/DMARC), so emails don't land in spam.

### 2. Umami (analytics)

1. Create a free account at **cloud.umami.is** (choose the EU region if asked) and add the website.
2. Copy its **Website ID** into `NEXT_PUBLIC_UMAMI_WEBSITE_ID` and redeploy.
3. The site sends these custom events:
   - **`Signup`**, with `source` (top/bottom form or `calc`), `locale`, `landing` (`ai`, `freelancers` or a calculator), `work` (the answer to "O que você faz?"), and on `/freelancers` and the calculators `receive` and `income`;
   - **`Calculator used`**, with `calc` (`real_rate`, `take_home`, `company` or `carne_leao`);
   - **`Feature vote`**, with `feature` (`income_report`, `salary`, `invoices` or `company_alert`): taps on "Quero isso" for features not built yet;
   - **`Bonus download`**, with `file` (spreadsheet or guide).
4. UTM campaigns show up in Umami automatically.

### 3. Deploy on Vercel

1. Push this folder to a GitHub repo owned by Xinning.
2. In Vercel: **Add New → Project → Import** the repo. Framework: Next.js (auto-detected).
   If this project sits in a subfolder of the repo, set **Root Directory** to that folder.
3. Add the variables from `.env.example` under **Settings → Environment Variables** (Production and Preview).
4. Deploy. Then connect the domain:
   1. In Vercel, **Settings → Domains → Add** `ganhometro.com.br` (and `www.ganhometro.com.br`) and choose the nameservers option.
   2. Send Gabriel the two nameservers Vercel shows.
   3. Gabriel enters them at registro.br (domain → **DNS** → change the servers) and confirms when done. It can take a few hours to take effect.
5. Set `NEXT_PUBLIC_SITE_URL=https://ganhometro.com.br` and redeploy. `NEXT_PUBLIC_*` values are baked in at build time.

**Without connecting GitHub (Vercel CLI).** The CLI uploads this folder directly:

1. Create the Vercel account with **Continue with Email**, then run `npx vercel login` here and confirm the email.
2. `npx vercel` makes a test deploy and links the project (the defaults are fine; the link is saved in `.vercel/`).
3. Add the variables from `.env.example` in the dashboard, or with `npx vercel env add NAME production`. Leave out
   `MAILPIT_URL` (local only).
4. `npx vercel --prod` publishes. Run it again for every update; it sends the files on disk, committed or not, so
   deploy from a clean, tested state.

`.vercelignore` keeps `.env.local` (local secrets) and build folders out of the upload; `assets/` must stay, because
the link preview images read its fonts.

### 4. Supabase (the app), when the app is ready to go live

Not needed for the waitlist. Xinning owns the account.

1. At **supabase.com**, create a project in the **São Paulo** region. Save the database password somewhere safe.
2. Send the database tables up: `npx supabase link --project-ref <project ref>`, then `npx supabase db push`.
3. **Authentication → URL Configuration:** Site URL `https://ganhometro.com.br`. Add the redirect URL
   `https://ganhometro.com.br/app/auth/confirm`.
4. **Authentication → Emails → Templates:** for both **Magic link** and **Confirm signup**, paste the contents of
   `supabase/templates/magic_link.html` and use the subject `Ganhômetro: seu código de acesso / your sign-in code`.
5. **Sign-in emails need your own sender.** Supabase's built-in email only reaches your own team and a few per hour.
   1. Create a **Resend** account and verify the domain `ganhometro.com.br` (it gives DNS records to add in Vercel → Domains).
   2. In Supabase, **Authentication → Emails → SMTP Settings:** host `smtp.resend.com`, port `465`, user `resend`,
      password = a Resend API key, sender `nao-responda@ganhometro.com.br`, name `Ganhômetro`.
   3. **Authentication → Rate Limits:** raise "emails sent per hour" (for example to 100).
6. Copy the **Project URL**, **Publishable key** and **Secret key** (Project Settings → API) into Vercel as
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`. Add a long random
   `CRON_SECRET` too: Vercel Cron sends it when it runs the jobs in `vercel.json`. For the app's own emails, add
   `RESEND_API_KEY` (the same Resend account as step 5) and `EMAIL_FROM`. Then redeploy.

### 5. Mercado Pago (plans and checkout)

Gabriel opens the account (CPF is enough) and adds Xinning as a collaborator. Then, in Mercado Pago:

1. **Suas integrações → Criar aplicação** (Checkout Pro and Assinaturas). Copy the **Access token** into Vercel as
   `MP_ACCESS_TOKEN`. Use the test credentials first, then the production ones.
2. **Webhooks:** URL `https://ganhometro.com.br/api/mercadopago/webhook`, events **Pagamentos** and **Planos e
   assinaturas**. Copy the **assinatura secreta** into Vercel as `MP_WEBHOOK_SECRET`.
3. For the founding sale, set `FOUNDING_UNTIL` (last day on sale) and `LAUNCH_DATE` (the day founding buyers' year
   starts). The public page is `/fundador` (`/en/founding`).
4. Redeploy. The plan page is `/app/plano`.

How it works: every payment is read back from Mercado Pago before anything changes, recorded once in
`billing_events`, and Pro time is granted or taken back (refunds, chargebacks) by database functions, so a repeated
notification changes nothing. A founding purchase made before signing up is applied when that email creates its
account.

**Testing locally without Mercado Pago:** run `node scripts/mock-mercadopago.mjs` (a fake Mercado Pago on port 54399:
checkout page, signed notifications, refunds, renewals) and start the app with `MP_API_URL=http://127.0.0.1:54399 MP_ACCESS_TOKEN=TEST-local MP_WEBHOOK_SECRET=test-webhook-secret
FOUNDING_UNTIL=2026-12-31 LAUNCH_DATE=2027-01-15 npm run dev`.

## Admin page (`/admin`)

A private dashboard for the waitlist, in English:
- total signups, last 7 days, today, and progress toward the 300–500 goal;
- signups per day (last 30 days, São Paulo time);
- breakdowns by channel (`utm_source`), campaign, language, form, landing page (including each calculator), what people do, how they're paid and income range;
- the latest signups with their consent date;
- a **Download CSV** of the whole list.

The data is read live from Brevo, so the page needs `BREVO_API_KEY` and `BREVO_LIST_ID`.

**Turn it on:** set `ADMIN_PASSWORD` (12+ characters, not used anywhere else) in Vercel and redeploy, then open
`https://ganhometro.com.br/admin`. You stay signed in for 7 days. Changing the password signs everyone out.
The page is hidden from search engines and nothing links to it.

## Signup bonus: carnê-leão spreadsheet

`public/Carne-leao-2026-Ganhometro.xlsx` is the free "Carnê-leão 2026 para quem recebe em dólar"
spreadsheet (PT-BR). People enter their dollar payments, and it estimates each month's tax with the 2026 rules.
After signup, the thank-you message shows a download link, but only when `NEXT_PUBLIC_BONUS_READY=true`.

**Keep it off until an accountant has confirmed:**
1. The R$ 607,20 simplified monthly discount applies in carnê-leão. The "zero tax up to R$ 5 mil" result depends on it.
2. People should enter the gross amount, before PayPal, Wise or Payoneer fees.
3. The receipt date is the day the money is credited to the person (PayPal, Wise or the bank).
4. 31/12 counts as a non-business day for the DARF. If so, November's DARF is due 30/12.
5. The legal references on the "Tabelas" tab.

**Rebuild and verify** (Python 3, `pip install xlsxwriter openpyxl formulas`):

```bash
python bonus/build_carne_leao.py                  # writes public/Carne-leao-2026-Ganhometro.xlsx
python bonus/build_carne_leao.py --update-rates   # first refreshes bonus/ptax.json from the Banco Central
python bonus/verify_carne_leao.py                 # recalculates every formula and compares with the model
```

December's rate is published on 13/11/2026. After that date, run the `--update-rates` command and the verify script, then commit.
Rules and rates live at the top of `build_carne_leao.py`, which makes a 2027 version a matter of updating those values.

## Before launch

- [ ] Set up forwarding for `contato@ganhometro.com.br` (the default contact email), or set `NEXT_PUBLIC_CONTACT_EMAIL` to another address.
- [ ] Set `NEXT_PUBLIC_CONTROLLER_NAME` (the data controller named in the privacy policy). Until then the page shows `[NOME DO RESPONSÁVEL]`.
- [ ] Have a lawyer review `/privacidade` and `/termos`. They are a solid draft, not legal advice.
- [ ] The FAQ says the carnê-leão estimate is "revisada por um contador antes do lançamento". Make sure that happens, and that the review covers the calculators and the app's take-home (`src/lib/money/tax.ts`, `convert.ts`, `received.ts`): carnê-leão, INSS, Simples Nacional on export revenue, the PF vs. CNPJ comparison, tax on the amount before the platform's commission and fees, euros/pounds converted to dollars at the day's parity first, the DAS due on the 20th (next business day when it isn't one), the self-employed INSS on the 15th, and the company comparison using the real RBT12.
- [ ] Submit a real signup on the live site and confirm it lands in the Brevo list with the attributes filled.
- [ ] Open the live URL with `?utm_source=teste&utm_campaign=teste`, sign up, and check the UTM attributes in Brevo.
- [ ] Share the URL on WhatsApp and check the preview image.
- [ ] With Resend set up, check that a reminder and the Monday summary arrive in Gmail and Outlook, and not in spam.
- [ ] After the accountant review of the spreadsheet, set `NEXT_PUBLIC_BONUS_READY=true` and redeploy.
- [ ] Adding Meta or Google ad pixels later requires a cookie consent banner and an update to the privacy policy.

## Changes from the design (`Main.dc.html`)

- Hero example card: Plataforma A shows **R$ 72,86/h** (the design had 72,88). Example numbers are now computed with the calculator's own logic, so they always match.
- Stage 2 features (exchange and fee loss, income-drop alert) are marked **"Em breve"** in Recursos and in the Pro plan, like the Stage 3 ones.
- `[PREÇO]` → **R$ 14,90**.
- Nav order now follows the page order. "Calculadora" became **"Calculadoras"**, a link to the free calculators page; the real-rate calculator is still on the home page and listed there.
- Footer links point to real `/privacidade` and `/termos` pages. "Termos" used to point to the FAQ.
- Added: LGPD consent checkbox, error state, and a "Estimativa, não é orientação contábil" note in the carnê-leão section.
- The hero headline scales down slightly on phones narrower than 400px, and the card grids no longer overflow at 320px. Desktop is unchanged.
- Calculator logic is unchanged, including the parsing rule from the handoff (`1.200` without a comma reads as 1,2).
