# Ganho Real — landing page

The waitlist site for Ganho Real (PT-BR). Next.js 16 (App Router) + Tailwind CSS 4, deployed on Vercel.
Signups go to a Brevo list, and analytics use Plausible (no cookies).

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional locally
npm run dev                  # http://localhost:3000
```

Without Brevo keys, the form still works locally. The signup is printed in the terminal instead of being saved.
In production, a missing key makes the form show an error, so a misconfigured deploy can't silently lose signups.

Checks: `npm run lint` and `npm run build`.

## What's where

| Path | What it is |
|---|---|
| `src/app/page.tsx` | The landing page (all sections, in design order) |
| `src/components/Calculator.tsx` | Real hourly rate calculator (client) |
| `src/lib/calc.ts` | Calculator formulas and Brazilian number parsing, ported 1:1 from the design |
| `src/components/WaitlistForm.tsx` | Email form with LGPD consent, honeypot, thank-you state |
| `src/app/api/subscribe/route.ts` | Server route that adds the contact to Brevo |
| `src/lib/utm.ts` | Remembers `utm_*` from the landing URL and sends them with the signup |
| `src/lib/content.ts` | Feature list and FAQ copy |
| `src/lib/site.ts` | Site name, URL, contact email, data controller |
| `src/app/privacidade`, `src/app/termos` | Privacy policy (LGPD) and terms, PT-BR |
| `src/app/opengraph-image.tsx` | Link preview image for WhatsApp, Instagram and others |

## Setup

### 1. Brevo

1. Create a list, for example "Lista de espera", and note its **ID** → `BREVO_LIST_ID`.
2. Create an API key (SMTP & API → API keys) → `BREVO_API_KEY`.
3. Contacts → Settings → Contact attributes: create these **Text** attributes:
   `SIGNUP_SOURCE`, `CONSENT_AT`, `UTM_SOURCE`, `UTM_MEDIUM`, `UTM_CAMPAIGN`, `UTM_CONTENT`, `UTM_TERM`.
   They hold the LGPD consent record and the campaign that brought each signup.
   If they are missing, the route still saves the email, but without this data.
4. Recommended: turn on double opt-in. Create a "double opt-in" template in Brevo, then set
   `BREVO_DOI_TEMPLATE_ID` and `BREVO_DOI_REDIRECT_URL` (for example `https://ganhoreal.com.br/?confirmado=1`).
   The thank-you message then asks people to confirm by email.
5. Authenticate the sending domain in Brevo (SPF/DKIM/DMARC), so emails don't land in spam.

### 2. Plausible

1. Add the site in Plausible and set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to the same domain.
2. Add two custom-event goals: **`Signup`** (with the custom property `source` = `hero` or `final`) and **`Calculator used`**.
3. UTM parameters show up in Plausible automatically under Sources → Campaigns.

### 3. Deploy on Vercel

1. Push this folder to a GitHub repo owned by Victor.
2. In Vercel: **Add New → Project → Import** the repo. Framework: Next.js (auto-detected).
   If `ganho-real/` is a subfolder of the repo, set **Root Directory** to `ganho-real`.
3. Add the variables from `.env.example` under **Settings → Environment Variables** (Production and Preview).
4. Deploy. Then go to **Settings → Domains**, add the domain and follow the DNS instructions.
5. Set `NEXT_PUBLIC_SITE_URL` to the final domain and redeploy. `NEXT_PUBLIC_*` values are baked in at build time.

CLI alternative: `npx vercel` (first deploy, links the project) and then `npx vercel --prod`.

## Before launch

- [ ] Set `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_CONTROLLER_NAME`. Until then the page shows `[SEU E-MAIL]` and `[NOME DO RESPONSÁVEL]`.
- [ ] Have a lawyer review `/privacidade` and `/termos`. They are a solid draft, not legal advice.
- [ ] The FAQ says the carnê-leão estimate is "revisada por um contador antes do lançamento". Make sure that happens.
- [ ] Submit a real signup on the live site and confirm it lands in the Brevo list with the attributes filled.
- [ ] Open the live URL with `?utm_source=teste&utm_campaign=teste`, sign up, and check the UTM attributes in Brevo.
- [ ] Share the URL on WhatsApp and check the preview image.
- [ ] Adding Meta or Google ad pixels later requires a cookie consent banner and an update to the privacy policy.

## Changes from the design (`Main.dc.html`)

- Hero example card: Plataforma A shows **R$ 72,86/h** (the design had 72,88). Example numbers are now computed with the calculator's own logic, so they always match.
- Stage 2 features (exchange and fee loss, income-drop alert) are marked **"Em breve"** in Recursos and in the Pro plan, like the Stage 3 ones.
- `[PREÇO]` → **R$ 14,90**.
- Nav order now follows the page order (Calculadora before Como funciona).
- Footer links point to real `/privacidade` and `/termos` pages. "Termos" used to point to the FAQ.
- Added: LGPD consent checkbox, error state, and a "Estimativa, não é orientação contábil" note in the carnê-leão section.
- The hero headline scales down slightly on phones narrower than 400px, and the card grids no longer overflow at 320px. Desktop is unchanged.
- Calculator logic is unchanged, including the parsing rule from the handoff (`1.200` without a comma reads as 1,2).
