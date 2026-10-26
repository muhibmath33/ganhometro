# Expanding the target audience: analysis and recommendation

**For:** Xinning. **Date:** 27 Oct 2026. Builds on [market-sizing.md](market-sizing.md).

## 1. Short answer

**Yes, expand. But in a planned order, not all at once.**

- **The data supports expanding.**
  - **Small and unstable:** the core AI-trainer market in Brazil is about **28,000 active people** (range 18–42k), and it moves with a few platforms (Outlier's worker app lost 14% of its traffic in one month).
  - **Low ceiling:** with AI trainers alone, the long-run ceiling is roughly **R$ 13–31k/month** in subscriptions.
- **Expanding everywhere at once would hurt the launch.**
  - **Weaker message:** "for everyone" convinces no one.
  - **Too little budget:** R$ 500–1.000/month of ads can't reach several audiences.
  - **Strong free competitors:** a broad product competes with Toggl and Clockify, which are free and good.
  - **Where Ganhômetro wins:** only where its **Brazil-specific** features matter: reais, the dollar-to-real conversion, the carnê-leão or company taxes, and payment tracking.

**My recommendation:**
1. **Launch with AI trainers** as planned. They are the sharpest message, concentrated in a few communities, and nobody serves them.
2. **Build the product general from day one,** so other audiences need marketing plus a few features, not a rebuild.
3. **Test the next audience in parallel** with a second landing page and a small ad budget, and let the numbers decide.
4. **Main expansion: Brazilians paid in dollars by the hour or by project** (developers, designers, translators, writers, video editors, virtual assistants). Bring it forward if the test is good.
5. **Cheap add-on: online tutors paid in dollars** (Cambly, Preply, italki).
6. **Later:** Spanish-speaking Latin America (the core features only).
7. **Not now:** app drivers/delivery riders and salaried PJ contractors.

## 2. How I compared audiences

Each candidate scored 1–5 on six criteria:

1. **Pain fit:** do they suffer the same problem: a gap between advertised and real pay, unpaid time, late or short payments?
2. **Brazil-specific value:** do the dollar-to-real conversion, carnê-leão / company tax and exchange losses matter to them? (This is our edge over free global tools.)
3. **Size** in Brazil.
4. **Reachability:** are they concentrated in communities we can reach cheaply?
5. **Ability to pay** R$ 14,90 or more.
6. **Effort and competition:** product work needed, plus how good the alternatives are (5 = little effort, weak competition).

| Audience | Pain fit | Brazil value | Size | Reach | Pays | Effort/competition | Verdict |
|---|---|---|---|---|---|---|---|
| **AI trainers** (now) | 5 | 5 | 2 | 4 | 2–3 | 5 (built) | Launch audience |
| **Freelancers paid in USD** (hourly or per project) | 4 | 5 | 4 | 3 | 4 | 3 | **Main expansion** |
| **Online tutors paid in USD** (Cambly, Preply, italki) | 5 | 4 | 2 | 3 | 2 | 5 | Cheap add-on |
| **Spanish-speaking LatAm** (AI trainers + freelancers) | 5 | 1 (each country needs its own tax module) | 4 | 3 | 3 | 2 | Later (core only) |
| **Creators paid in USD** (YouTube, Twitch, stock media) | 2 | 4 | 4 | 3 | 3 | 2 | Later, as a tax/exchange module |
| **Salaried PJ contractors** (Deel, Remote) | 1 | 3 | 3 | 3 | 4 | 1 | Keep out of scope (handoff) |
| **App drivers / delivery riders** | 4 | 1 | 5 | 4 | 2 | 1 | Not now (different product) |

## 3. The audiences in detail

### 3.1 Freelancers paid in dollars: the main expansion

- **Why the pain fits:**
  - **Unpaid time:** proposals, client calls, revisions and admin are unpaid.
  - **Fixed-price work hides the real hourly rate.**
  - **Fees:** platforms keep 10–20% (Fiverr keeps 20%, [source](https://www.freelasemcrise.com.br/blog/fiverr-para-brasileiro-2026)), and invoices get paid late.
- **Why Brazil-specific value is high:**
  - **Exchange losses:** PayPal, Wise and Payoneer fees and spreads eat into income.
  - **Taxes:** below about R$ 7.350/month they pay the carnê-leão as individuals. Above it, accountants generally recommend opening a company (Simples Nacional, about 6–11% vs. an effective 16–21%+ as an individual) ([contaja](https://contaja.com.br/blog/carne-leao-ou-cnpj/), [contabilidade.com](https://contabilidade.com/blog/carne-leao-ou-abrir-cnpj-qual-opcao-paga-menos-imposto/)). "When should I open a CNPJ?" is a real, money-sized question for them.
- **Size** (low confidence; no official count):
  - About **100,000 Brazilian developers** work for companies abroad (2022 estimate, out of 500k+ programmers, [Telesíntese](https://telesintese.com.br/payoneer-e-husky-focam-nos-profissionais-que-recebem-do-exterior/)). Part of them are salaried PJ contractors, outside our fit.
  - Payoneer ranks Brazil **3rd** among freelancing countries ([Payoneer](https://www.payoneer.com/resources/business/top-10-freelancing-countries/)). Deel lists Brazil among its top 5 countries for hiring contractors, and São Paulo as its #5 city ([Deel](https://www.deel.com/global-hiring-report-2025/)).
  - Workana has about 800–900k registered Brazilian freelancers, mostly paid in reais (upper bound only, [Tecla](https://www.tecla.io/blog/workana-review)).
  - **Fit estimate:** 50,000–150,000 Brazilians paid in dollars per hour or per project as individuals or small companies. That's 2–5 times the AI-trainer core.
- **Ability to pay:** higher. Brazilian freelancer rates are often US$ 15–35/h ([Skydo](https://www.skydo.com/blog/best-countries-hire-freelancers), third-party).
- **Competition:**
  - Time tracking: Toggl and Clockify, free and global ([Clockify](https://clockify.me/pt/freelance-time-tracking)).
  - Receiving money: Wise, Payoneer, Husky.
  - PJ accounting: accounting firms.
  - **No tool combines real rate per client + reais + carnê-leão/CNPJ decision + payment tracking.** That's the opening.
- **Harder to reach:** they're more scattered than AI trainers. The best channels are developer and design communities, LinkedIn, and YouTube/TikTok content about "ganhar em dólar".

### 3.2 Online tutors paid in dollars: the cheap add-on

- **The pain is almost identical to AI training:**
  - Cambly pays a fixed **US$ 10,20/h** but not the time spent waiting for students.
  - Preply keeps **100% of the first lesson and 18–33% after that**.
  - Lesson prep is unpaid.
  ([source](https://ganherecompensa.com.br/blog/como-dar-aulas-particulares-online-2026-plataformas-valores))
- **Product work is small:** a "platform commission" field and a "waiting for students" unpaid category.
- **Size is unknown and probably small** (thousands to low tens of thousands of Brazilians), and incomes are modest. Worth adding because it costs little, not because it's big.

### 3.3 Spanish-speaking Latin America: later

- **Large remote talent pools:** Argentina, Colombia and Mexico are in Deel's top 5 for contractor hiring.
- **Where the core works:** the real hourly rate, payment tracking and the timer work in any country.
- **Where it doesn't:** taxes and currency rules are different in each country (Argentina especially), so the "in reais + carnê-leão" edge disappears.
- **When:** only after the product clearly works in Brazil. Translate the core first, then add one country's tax module at a time.

### 3.4 Creators paid in dollars: later, different shape

- **The pain is different:** 200k+ Brazilian YouTube channels can monetize ([Canaltech](https://canaltech.com.br/mercado/youtube-injeta-quase-r-5-bi-no-brasil-e-tem-mais-de-200-mil-canais-monetizaveis/)), but their problem is irregular income from several sources and taxes. It's not hourly pay.
- **Possible later product:** a tax and exchange module, not the timer.

### 3.5 Not now

- **App drivers and delivery riders:**
  - **Big, but a different product:** 1.7M people ([IBGE 2024](https://www.folhape.com.br/economia/renda-media-de-motorista-por-app-e-de-r-139-por-hora-diz-ibge/444813/)), averaging R$ 13,90/h (drivers) and R$ 10,80/h (riders), 84% men. They need fuel, km and maintenance costs, not dollars or the carnê-leão.
  - **Contested ground:** a dedicated app already exists and is in court with Uber ([GigU/StopClub](https://mercadoeconsumo.com.br/16/01/2025/economia/cade-vai-apurar-praticas-da-uber-que-restringem-ferramentas-que-calculam-ganhos-de-motoristas/amp/)).
  - **The handoff already says:** only after separate research.
- **Salaried PJ contractors (Deel/Remote):** a fixed salary means no unpaid-time problem, and their tax needs are full accounting. The handoff excludes them for good reason.

## 4. What the bigger market could look like

| | Active, good fit | Long-run paying (about 5%) | Monthly revenue |
|---|---|---|---|
| AI trainers only | ~18–42k | 900–2,100 | R$ 13–31k |
| + freelancers paid in USD | +50–150k | +2,500–7,500 | +R$ 37–110k (at R$ 14,90; more with a higher freelancer tier) |
| + online tutors | +5–20k | +250–1,000 | +R$ 4–15k |
| **Total (Brazil)** | **~75–210k** | **~3,600–10,600** | **~R$ 55–155k** |

These are low-confidence estimates, but the direction is clear: **expansion multiplies the ceiling by 3–5×** in Brazil alone, before Latin America.

## 5. The plan

### Before launch (now to week 8): measure, don't commit

1. **Add one optional question to the signup form:** "O que você faz?" with the options: AI training / freelancer with foreign clients / online teacher / creator / other. It's saved in Brevo and shown in the admin page. This gives demand data for free.
2. **Second landing page, `/freelancers`** (PT/EN): same product, freelancer wording, e.g. "Descubra quanto cada cliente paga de verdade, por hora, em reais." Same waitlist, tagged by audience.
3. **Small test (weeks 6–8):** R$ 150–300 of ads to the freelancer page.
4. **Decision rule:** if a freelancer signup costs **no more than 1.5×** an AI-trainer signup, and at least 25% of signups pick a non-AI option, bring the freelancer expansion forward.
5. **The founding sale stays aimed at AI trainers** (week 8–9), so the main test of the plan isn't muddied.

### During the Stage 1 build (weeks 3–9): build it general

These are cheap now and expensive to change later:
- **Income sources** can be a *platform* or a *client*.
- **Projects** are hourly or **fixed-price** (the app computes the real hourly rate of a fixed-price job).
- **Currency per source:** USD, EUR, GBP or BRL.
- **Platform commission %** (Preply, Fiverr, Upwork).
- **Expected payment date per payment** (works for platform paydays *and* client invoices).
- **Unpaid categories** are editable (guidelines/tests for AI trainers; proposals/revisions/calls for freelancers; waiting for students for tutors).

### 1–3 months after launch: tutors (small)

Commission field, "waiting for students" category, and a `/professores` landing page.

### 3–6 months after launch: freelancers (the main expansion)

- **Clients and fixed-price projects,** invoice due dates with late-payment alerts (reusing feature 4), and an English invoice PDF (reusing the dispute PDF).
- **Exchange and fee loss tracker:** Stage 2 feature 7, brought forward. It's core for this audience.
- **"Quando vale abrir CNPJ?" simulator,** carnê-leão vs. Simples Nacional. Strong marketing hook, reviewed by the accountant, always labelled "estimativa".
- **Pricing:** consider a **Pro Freelancer** tier at R$ 24,90–29,90/month (clients, invoices, CNPJ simulator). This audience earns more and gets more value. Decide with real data.

### Positioning and brand

- **Name:** "Ganhômetro" (earnings meter) already fits every audience. No rename needed.
- **Headline:** grows from "quanto cada plataforma paga" to "**quanto cada plataforma ou cliente paga de verdade, em reais**".
- **One product, different landing pages and messages per audience.**

### Extra revenue to consider

Freelancers approaching R$ 7.350/month need a digital accountant to open a CNPJ, and almost everyone needs an account to receive dollars. Disclosed **referral partnerships** could earn more per user than the subscription: digital accounting firms, and Wise, Nomad/Husky or Payoneer. Keep them clearly labelled and never let them bias the numbers the app shows.

## 6. Risks and how to handle them

| Risk | Mitigation |
|---|---|
| The launch message gets diluted | Separate landing pages; the founding sale stays AI-trainer-focused |
| Too little budget for several audiences | Test with R$ 150–300 before committing; let cost per signup decide |
| The product gets complicated | Build the general data model now; add audience features later, behind the same simple timer |
| Tax claims for companies (PJ) | The simulator is an estimate, reviewed by the accountant, and links to professionals |
| Privacy | Same rule: time and money only. Client names can be nicknames; no project content |
| AI-training demand drops | Expansion is also insurance against a platform shrinking |

## 7. Decisions needed from Xinning

1. **Agree with the order?** (AI trainers → tutors → freelancers paid in USD → Latin America; drivers/PJ contractors out.)
2. **Approve the before-launch measurement:** the signup question plus the `/freelancers` page and test.
3. **Approve building the Stage 1 data model general** (I'd update the Stage 1 proposal).
4. **Pricing:** keep one Pro price for now and decide on a Pro Freelancer tier after the test?
