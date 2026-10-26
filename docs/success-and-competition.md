# Will Ganhômetro succeed in Brazil? Competition and honest assessment

**For:** Xinning. **Date:** 27 Oct 2026. Builds on [market-sizing.md](market-sizing.md) and [audience-expansion.md](audience-expansion.md).

## 1. Verdict

**It can succeed as a small, profitable product, but not as a big business on AI trainers alone, and not by paid ads alone.**

- **The gap is real:** I found **no product in Brazil** that combines a real hourly rate per platform or client, conversion to reais, payment monitoring and the carnê-leão. The pain is real and documented.
- **But every piece has a free substitute:** spreadsheets, Toggl/Clockify, the official Carnê-Leão Web and many free tax calculators, plus a free global AI-trainer pay tracker. **The value has to come from putting the pieces together, the alerts and the convenience.** That's harder to sell than a single killer feature.
- **The core market is moving:** Outlier, the platform most associated with Brazilian AI trainers, **had zero projects open to Brazil on 2 Sep 2026**, down from six on 20 Aug ([Ganhe Recompensa](https://ganherecompensa.com.br/blog/ganhar-dinheiro-treinando-ia-2026-como-comecar)). Work is shifting to Mercor, TELUS, Prolific, Mindrift and Appen, and to **lower-paid video-recording tasks for robot training** (US$ 2,50–13/h).

**My judgment of the odds** (not statistics; an estimate from the evidence):

| Outcome | AI trainers only | With the freelancer expansion done well |
|---|---|---|
| Founding sale reaches **50 sales** (the handoff's gate) | ~35% with 300–500 signups; ~55% with 800–1,000 | — |
| **150+ paying users within 12 months** (covers marketing) | ~30–40% | ~45–55% |
| **1,000+ paying users within 24 months** | ~10–15% | ~25% |

**What moves these odds most:**
- whether people **keep logging** their time and payments (habit);
- whether growth comes from **communities and creators** rather than ads;
- **expanding early** to freelancers paid in dollars.

## 2. Competition in Brazil

| Type | Who | What they do | Price | Overlap | Our difference |
|---|---|---|---|---|---|
| AI-trainer tool (global) | [aitrainer.work Pay Tracker](https://aitrainer.work/pay-tracker) | Logs sessions; true hourly rate including unpaid time; community pay surveys | Free | **High (core idea)** | English only, dollars only, no reais, no tax, no payment alerts. It proves the idea resonates. |
| AI-trainer guide (Brazil) | [Treinadores de IA](https://www.treinadoresdeia.com.br/) (+ WhatsApp, YouTube @notaboutdollar) | Free guide to 9 platforms (mostly robot video tasks), earnings estimate slider, referral links | Free | Low | No tracking, no tax ("não sou contador"). **Better as a partner** (creator/affiliate) than a rival. |
| DIY | Spreadsheets, platform dashboards | Manual tracking | Free | Medium | Effort; no unpaid time, no reais, no alerts |
| Time trackers | [Toggl](https://clickup.com/pt-BR/blog/40537/clockify-vs-toggl), [Clockify](https://clockify.me/pt/freelance-time-tracking) | Timers, projects, reports | Free tiers; paid ~US$ 9–18/user | Medium | Not built for Brazil: no reais conversion, carnê-leão, payment monitoring or "possível diferença" |
| Carnê-leão | [Carnê-Leão Web (official)](https://www.gov.br/pt-br/servicos/apurar-carne-leao); calculators like [Calculas](https://calculas.com.br/carne-leao), [Amplitude](https://www.amplitudecontabil.com.br/calculadoras/carne-leao), [Anexo3](https://anexo3contabilidade.com.br/calcular-carne-leao.html) | Monthly tax calculation | Free | Medium (tax only) | Tax is a commodity. **Our edge is automation** (from logged payments, with the right PTAX) and reminders, not the formula. This confirms "bonus, not headline". |
| Dollar accounts | Wise, Payoneer, Nomad/Husky, Airtm, PayPal | Receive and convert dollars | Fees/spreads | Low | They move money but don't track hours, real rates or taxes. **Partners** (referrals), not rivals. |
| Accountants | Digital accountants, carnê-leão services | Taxes, CNPJ | Monthly fee | Low/medium (higher earners) | We're the step before ("when should I open a CNPJ?") and could refer to them |
| Driver apps | [GigU/StopClub](https://mercadoeconsumo.com.br/16/01/2025/economia/cade-vai-apurar-praticas-da-uber-que-restringem-ferramentas-que-calculam-ganhos-de-motoristas/amp/) | Earnings per km/hour for Uber/99 drivers | — | None (different audience) | Shows the "real earnings" idea works in Brazil, and that platforms fight tools that read their data (we don't) |

**Conclusion:** no direct Brazilian competitor today. The closest is a free English tool, which validates the idea. The real competitor is **"I'll just use a spreadsheet, or nothing"**. That's what to beat.

## 3. What the market is doing

1. **LLM text work for Brazil is shrinking or unstable** (Outlier went to zero Brazil projects in Sep 2026). Mercor, TELUS Digital, Prolific, Mindrift and CrowdGen (Appen) still accept Brazilians.
2. **New wave: video data for robots.** Platforms pay US$ 2,50–13/h to record point-of-view videos of everyday tasks (Treinadores de IA lists 9). These have **lots of unpaid time** (setup, rejected recordings, uploads) but **lower incomes**, so subscriptions are harder to sell.
3. **Pay disputes are common:** Outlier faces lawsuits over pay and classification ([visu.network](https://visu.network/blog/outlier-ai-review/)), and Mercor cut rates on projects. That supports the underpayment detector and dispute PDF.

**Implications for the product:**
- Support **per-task pay** (per video or per task), not only hourly.
- Keep the message **platform-neutral**: "qualquer plataforma".
- Consider updating the hero badge, which names Outlier first, if Outlier stays closed to Brazil.

## 4. Strengths, weaknesses, opportunities, threats

| Strengths | Weaknesses |
|---|---|
| Clear, specific pain; strong privacy promise; nothing similar in Portuguese; cheap to build and run; site, calculator, bonus and admin already built | Manual logging (habit is hard); every piece has a free substitute; low incomes; the team is far from the market (language, time zone); revenue lands on an individual's CPF |
| **Opportunities** | **Threats** |
| Freelancers paid in dollars (bigger, pay more); the CNPJ question; creator partnerships; referral revenue (accountants, dollar accounts); Latin America later | Platforms cutting Brazil (Outlier); pay falling (video tasks); high churn when work dries up; tax rule changes; a free global tool adding Portuguese |

## 5. Unit economics: why ads alone won't work

- **Revenue per user:** R$ 14,90/month. Card fees take about 4% (R$ 0,60), and tax on the revenue depends on the owner structure (see risk 6).
- **Churn assumption:** 8–12% of paying users cancel each month (gig work comes and goes), so an average customer stays 8–12 months.
- **Lifetime value per paying user:** about R$ 120–180 gross, roughly R$ 85–150 after fees and taxes.
- **Cost to win one paying user through ads:**
  - a signup costs R$ 3–8 via Instagram/TikTok in Brazil (to confirm with the test);
  - 4–6% of signups become paying;
  - so **R$ 50–200 per paying user**.
- **So:** paid ads alone break even at best. **Growth has to come from cheap channels:** WhatsApp/Telegram groups, creators (paid per sale or with free Pro), word of mouth ("possível diferença" and "this platform really pays R$ X/h" are shareable moments), the free calculator for search traffic, and later the annual plan (R$ 129), which reduces churn. Use ads for testing, not as the engine.

## 6. The biggest risks and what to do

1. **Core audience shrinks** (Outlier and others cut Brazil).
   → Platform-neutral message; per-task pay; run the freelancer test **before launch** (audience-expansion.md).
2. **People stop logging** (no habit, no value).
   → One-tap timer; payday reminders ("did platform X pay you today?"); a weekly summary with one striking number. Measure: **≥40%** of new users log 3+ sessions in week 1; **≥25%** still active at day 30.
3. **Low willingness to pay.**
   → A useful free plan. Pro tied to money moments: underpayment found, late payment, R$ 5 mil alert, CNPJ simulator. Annual plan.
4. **Expensive growth.**
   → Creator and affiliate partnerships, community presence, organic content. Spend on ads only where cost per signup is proven.
5. **Distance from the market.**
   → A Brazilian marketer (planned); Portuguese support templates; Gabriel as the local face where needed.
6. **Legal and money structure.**
   → All revenue goes to Gabriel's CPF, so Gabriel owes personal income tax on it (carnê-leão) until there's a company. **Formalize the partnership** (written agreement) and plan the **CNPJ** early with the accountant.

## 7. Signals to watch (go / adjust / stop)

| When | Signal | Good | Worrying |
|---|---|---|---|
| Weeks 4–8 | Cost per signup | ≤ R$ 5 | > R$ 10 |
| Weeks 4–8 | Signups | 500–1,000 | < 300 |
| Weeks 4–8 | Answers to "O que você faz?" | Freelancer share ≥ 25% → expand sooner | — |
| Week 9 | Founding sales | ≥ 50 | < 20 → interview, change offer or audience (handoff gate) |
| Month 1–3 | Week-1 activation (3+ sessions) | ≥ 40% | < 20% |
| Month 1–3 | Day-30 retention | ≥ 25% | < 10% |
| Month 3 | Free → Pro | ≥ 4% | < 1,5% |
| Month 3+ | Monthly churn (Pro) | ≤ 8% | > 15% |

## 8. What I'd change in the plan now

1. **Run the freelancer test before launch** (signup question + `/freelancers` page). This is now more urgent, given Outlier's move.
2. **Build the data model general,** including **per-task pay** and platform types beyond LLM work (video/robotics tasks).
3. **Platform-neutral copy:** keep "Outlier, DataAnnotation, Mercor e outras" for now, but be ready to switch the badge to platforms still open to Brazil (e.g. "Mercor, TELUS, Prolific e outras"). Your call.
4. **Partner with creators** in this niche (e.g. Treinadores de IA, YouTube channels about "trabalhar com IA em dólar"): per-sale commission or free Pro.
5. **Plan referral revenue** (dollar accounts, accountants), clearly disclosed.
6. **Formalize the Xinning–Gabriel partnership** and the path to a CNPJ before the founding sale brings in money.
