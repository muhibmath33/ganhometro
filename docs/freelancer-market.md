# Brazilian freelancers paid from abroad: what they want, where the gap is, how to win it

**For:** Xinning. **Researched:** 27 Oct 2026. **Confidence:** medium on needs and competition, low on market size. There's no official count of Brazilians paid in foreign currency for their work, so the sizes below are triangulated estimates.

## Bottom line

1. **Who:** an estimated **250–500k Brazilians** are regularly paid in foreign currency for their work: developers, designers, marketers, customer support, translators, AI trainers, tutors. About **100–250k** manage their own money and taxes as individuals (PF) or through a small company (CNPJ). They're the realistic audience for a Portuguese-language app.
2. **What they really want** is not a better timer. In order:
   - **predictable income** (74% call instability their biggest problem);
   - **to keep more of what they earn** (fees and, above all, tax: at R$ 16.500 a month, about 29% goes to tax and INSS as an individual vs. about 8% with a CNPJ, accountant included; see §2.1);
   - **a safety net** that CLT used to give them (13º, férias, INSS, health insurance);
   - **to stay right with the Receita** (it cross-checks bank data);
   - **to be paid on time**;
   - **to prove their income** when renting or borrowing.
3. **Where the gap is:** the money changes hands four times: client → platform or fintech → Brazilian bank → Receita. Each company sees only its own piece.
   - **Fintechs** (Wise, Payoneer, Husky, Remessa Online…) move the money.
   - **Accountants** look after the *company*.
   - **Calculators** answer one question and forget you.
   - **Bonsai and Toggl** are American tools.
   - **Nobody looks after the person:** how much is really left in reais, what to set aside, when a CNPJ pays off, how to prove the income. In my searches I found no Brazilian product doing this. That doesn't prove none exists, but none is visible.
4. **Proposal:** for freelancers, position Ganhômetro as **"o app financeiro de quem ganha em dólar"**, with five parts:
   - **Quanto sobra:** net income in reais after fees and taxes.
   - **Leão em dia:** PF tax done monthly, plus the PF-or-CNPJ decision.
   - **Reservas:** pay yourself a salary; set aside money for 13º, férias, INSS and the leão.
   - **Comprovante de renda:** a report you can hand to a landlord, a bank or an accountant.
   - **Clientes e faturas:** invoices in English and late-payment alerts.

   The timer and the real hourly rate stay, for people paid by the hour.
5. **Don't compete** on receiving money, accounting, NFS-e, finding clients, or time tracking alone. Those markets are crowded. Partner with them instead: accountants, fintechs and insurers become referral income.
6. **How:** validate the message now (landing page, interviews, fake-door buttons, free calculators). Then reorder the build so payments and taxes come before projects and invoices. Details in §6.

## 1. Who they are

| Segment | Example | Typical income | How they're paid | PF or CNPJ | What matters most | Fit |
|---|---|---|---|---|---|---|
| **Global contractors** | Developer working full-time for one US company | R$ 13–35k/month ([TechFX survey](https://olhardigital.com.br/2025/03/20/pro/brasileiros-podem-triplicar-salarios-trabalhando-para-o-exterior-diz-pesquisa/), junior to senior) | Monthly, via Deel, Husky, Wise | Mostly CNPJ (PJ) | Net in reais, taxes, reserves for 13º/férias, proof of income | **High.** Highest willingness to pay, easy to reach in dev communities |
| **Direct-client freelancers and micro-agencies** | Designer with 3 clients in the US and Europe | R$ 5–25k, irregular | Invoices, Wise, Payoneer, PayPal | PF, often moving to CNPJ | Invoices, late payments, PF→CNPJ, net income | **High** |
| **Marketplace freelancers** | Writer or developer on Upwork, Fiverr | R$ 2–15k, irregular | Platform → Payoneer or bank | Mostly PF | Platform fees, real hourly rate, carnê-leão | **Medium–high** |
| **AI trainers** (current core) | Outlier, DataAnnotation, Mercor | R$ 2–8k | PayPal, Payoneer | PF | Real hourly rate, late and short payments, carnê-leão | **High** (see [market-sizing.md](market-sizing.md)) |
| **Online tutors** | Cambly, Preply, italki | R$ 2–6k | Platform → PayPal, Payoneer | PF | Commission, waiting time, carnê-leão | Medium |
| **Creators** | YouTube, stock media | Very uneven | AdSense, platforms | PF or CNPJ | Taxes, exchange | Low for now |

**Market size (low confidence):**
- **Developers:** about **100,000** Brazilian developers worked for companies abroad in 2022 ([Telesíntese](https://telesintese.com.br/payoneer-e-husky-focam-nos-profissionais-que-recebem-do-exterior/)).
- **Hiring growth since then:** Deel reports foreign demand for Brazilian talent **up 53% in 2025**, putting Brazil 5th worldwide ([Exame](https://exame.com/carreira/fuga-de-cerebros-demanda-internacional-por-profissionais-brasileiros-cresce-53/)). TechFX surveyed 1,611 such professionals; **85% work for US companies** ([Olhar Digital](https://olhardigital.com.br/2025/03/20/pro/brasileiros-podem-triplicar-salarios-trabalhando-para-o-exterior-diz-pesquisa/)).
- **One fintech alone:** Husky had **30,000+ clients** and R$ 6 billion transacted at its last public update (undated) ([Finsiders](https://finsidersbrasil.com.br/reportagem-exclusiva-fintechs/com-operacoes-integradas-nomad-e-husky-planejam-novas-solucoes)).
- **Service exports overall:** a record **US$ 51.8 billion in 2025**, 65% of it digital services ([Exame](https://exame.com/economia/exportacoes-de-servicos-batem-recorde-e-alcancam-us-518-bi-em-2025/)). Mostly companies, but the trend is clear.
- **Freelancers paid in reais are a different market:** Workana has about 1.6 million Brazilians registered (pandemic-era figure, [Tribuna de Jundiaí](https://tribunadejundiai.com.br/economia/busca-por-profissionais-autonomos-e-freelancers-cresce-no-brasil-durante-a-pandemia/)), mostly paid in reais.
- **Estimate:**
  - developers abroad: 150–200k;
  - other professions: 50–150k;
  - marketplace freelancers paid in dollars: 30–80k;
  - AI trainers: ~40k active.

  Allowing for overlap, that's **250–500k** people.

**What that could be worth:** if 2–3% of the 100–250k addressable people pay, that's **2,000–7,500 paying users**, or **R$ 30–110k/month at R$ 14,90**. More with a higher freelancer tier or referral income. This matches the estimate in [audience-expansion.md](audience-expansion.md).

## 2. What they really want, with evidence

| # | Need | Evidence | Can Ganhômetro help? |
|---|---|---|---|
| 1 | **Predictable income** | **74.1%** name financial unpredictability as their biggest challenge. 33% saw income fall in the last 12 months ([HUG survey, 2026](https://www.cartacapital.com.br/do-micro-ao-macro/freelancers-brasil-necessidade-desafios-pesquisa/)) | **Yes:** "pay yourself a salary", reserves, a forecast of money owed |
| 2 | **More clients** | **59.3%** (same survey) | No. Crowded with platforms and courses. Not our lane. |
| 3 | **A safety net** (health, pension, paid vacation) | **55.6%** miss CLT benefits (same survey). Company Hero and Deel launched health insurance for PJs working abroad ([Startups](https://startups.com.br/negocios/company-hero-e-deel-levam-beneficios-a-pjs-que-trabalham-para-o-exterior/)) | **Yes:** reserves for 13º, férias, INSS and emergencies. Insurance by referral. |
| 4 | **Fair pricing** | **50%** struggle to set fair rates (same survey) | **Yes:** a minimum rate from their *measured* costs, unpaid time and taxes |
| 5 | **Keep more of the money: fees** | Hidden spread is the real cost. A 2% spread on US$ 3,000 at R$ 5,80 costs about **R$ 348** ([FreelaSemCrise](https://www.freelasemcrise.com.br/guias/recebimento-internacional)). Reported spreads on receiving range from 0.7% to 1.64% (Remessa Online), and up to 7–10% at traditional banks ([ARQ](https://www.arqfinance.com/articles/receber-pagamentos-internacionais-freelancer-brasil/); provider data, to verify) | **Yes:** a fee audit of their own payments, and what switching would save |
| 6 | **Keep more of the money: tax** | As PF, income above R$ 7.350/month pays up to **27.5%** (carnê-leão). With a CNPJ in Simples Nacional, export revenue is spared ISS/PIS/COFINS: **about 2–3% DAS** with Fator R ≥ 28% ([Agilize](https://agilize.com.br/artigos/?p=4080)). Example in §2.1. | **Yes:** a PF-or-CNPJ monitor on their real income, then a hand-off to an accountant |
| 7 | **Stay right with the Receita** | Banks report account movements to the Receita (e-Financeira). One designer ended up owing about **R$ 47,000** after two years without declaring. The fine is 75% of the tax owed (150% for deliberate concealment) ([Estado de Minas, 2026](https://www.em.com.br/emfoco/2026/04/19/trabalhei-como-freelancer-por-2-anos-sem-declarar-nada-hoje-devo-r-47-000-a-receita-federal/)) | **Yes:** carnê-leão every month from actual receipts, DARF reminders |
| 8 | **Get paid on time** | **85%** of freelancers face late payments at least sometimes; 21% are paid late or not at all more than half the time (Remote, 2025, via [MediaPost](https://mediapost.com/publications/article/415441/payments-to-agencies-freelancers-increasingly-del.html)). **29%** of invoices are paid late (Bonsai, 100k freelancers) | **Yes:** invoices with due dates, alerts, a polite reminder in English |
| 9 | **Prove income** | QuintoAndar asks for income ≥ 2.5× the rent, and self-employed people send 90 days of bank statements ([QuintoAndar](https://www.quintoandar.com.br/guias/?p=2279805)). The formal option, DECORE, can only be issued by an accountant: R$ 50–500, valid 90 days from 2026, with documents uploaded ([Contábeis](https://www.contabeis.com.br/noticias/60419/decore-como-emitir-e-utilizar-a-declaracao-para-profissionais-autonomos/)) | **Yes:** an income report with every payment in reais at PTAX, plus the document pack the accountant needs for a DECORE |

Note: in the HUG survey only 25.9% name "tax and admin" as a problem. But HUG's sample is mostly communication professionals paid in reais. For people paid from abroad the rules are harder: the PTAX rule, carnê-leão with no withholding, export rules. So expect this to rank higher for them.

### 2.1 How much is left: an illustrative example (estimate, for the accountant to check)

Ana is a UX designer. Two US clients pay her **US$ 3,000 a month** via Wise. Exchange rate R$ 5,50.

| | As an individual (PF) | With a CNPJ (Simples, Fator R) |
|---|---|---|
| Gross in reais | R$ 16.500 | R$ 16.500 |
| Exchange spread and fees (~1.5%) | − R$ 250 | − R$ 250 |
| Income tax | − R$ 3.160 (carnê-leão; the INSS paid is deducted from the base) | − R$ 500 (DAS ~3% on export revenue) |
| INSS | − R$ 1.695 (20%, at the ceiling) | − R$ 510 (11% on a pro-labore of 28% = R$ 4.620; its IRRF is zero under the 2026 rules) |
| Accountant | — | − R$ 250 |
| **Left in reais** | **≈ R$ 11.390 (69%)** | **≈ R$ 14.990 (91%)** |

**The CNPJ leaves about R$ 3.600 more per month, roughly R$ 43.000 a year.** Even if Ana skipped INSS as PF (it's mandatory, but often skipped), the difference would still be about R$ 2.200–2.400 a month. One caveat for the accountant: INSS at 20% on the ceiling builds a larger pension than 11% on a pro-labore, so the comparison isn't only about tax.

Most people paid from abroad don't know these numbers for their own case. Showing them every month, with their real figures, is the strongest hook we have.

Rules used, to be checked by the accountant:
- the 2026 IR table (up to 27.5%, with a deduction of R$ 908,73);
- the Lei 15.270/2025 reduction (doesn't apply above R$ 7.350);
- the INSS ceiling (R$ 1.695,11 at 20%);
- Simples Nacional Anexo III with Fator R, and the ISS/PIS/COFINS exemption on exports.

## 3. Who already serves them

| Need | Who serves it today | How well | The gap |
|---|---|---|---|
| Receiving money | Wise, Payoneer, Husky (Nomad), Remessa Online (EBANX), TechFX, ARQ, Inter, C6, Deel | **Crowded**, and they compete on price | Each sees only its own transactions. People use 2–3 of them. |
| Company accounting (PJ) | Contabilizei, Agilize, Contabilidade Zen, Company Hero, local accountants (from about R$ 159/month) | **Crowded** | They look after the company, not the person's whole money. They're potential **partners**. |
| Individual tax (carnê-leão) | The Receita's Carnê-Leão Web (manual entry); free calculators such as [FreelancerBR](https://www.freelancerbr.com/), Traderbrasil, Calculas | **Weak.** Calculators are one-off, and FreelancerBR deliberately stores nothing. | **Nobody tracks it monthly from your actual receipts** |
| PF-or-CNPJ decision | Accountants' blog posts and calculators; FreelancerBR's "MEI vs PJ vs Autônomo" | **Medium**, but generic | No one monitors your real 12-month income and tells you *when* |
| Invoices in English | Bonsai (English only, US-centric), Invoice Ninja, FreelancerBR generator, Deel (for its own contractors) | **Medium** | Not linked to payments received, fees or tax |
| Time tracking | Toggl, Clockify, Harvest, TaskRush (Brazilian) | **Crowded**, many free | Real rate in reais, counting unpaid time: nobody |
| Personal finance | Mobills, Organizze, bank apps | Strong for salaried people | Not built for irregular dollar income, reserves or carnê-leão |
| Benefits | Company Hero + Deel (health and life insurance for PJs) | New | Referral partner |
| Proof of income | Accountants (DECORE) | Works, but slow and paid | **Nothing prepares the evidence** |
| Calculators and guides | FreelancerBR, FreelaSemCrise, exiap and others, all free | Many | They show demand. Our free tools must be at least as good, and they lead into the app. |

**Abroad, the "money + tax for freelancers" model is proven:** Lili (US) had 500,000+ users in 2022, with tax-savings buckets ([Fintech Futures](https://fintechfutures.com/?p=15228966)). Keeper charges US$ 20/month to find deductions ([Finder](https://www.finder.com/best-tax-software/keeper-tax)). I found **no Brazilian equivalent**.

## 4. Where competition is low

| Opportunity | Value to the user | Competition | Why it's defensible |
|---|---|---|---|
| **A. Quanto sobra:** net income in reais after platform fees, spread, tax and INSS, across all clients and providers | Very high | **None found** | Needs data from several providers plus Brazilian tax rules. Fintechs stay inside their own data. |
| **B. Leão em dia (PF):** monthly carnê-leão from actual receipts at the correct PTAX, DARF reminders, expenses for livro-caixa (if the accountant confirms they apply to income from abroad), annual summary for the IRPF | High | **Low** | We already built the 2026 tax model (spreadsheet), the PTAX rule and the reminders plan |
| **C. PF-or-CNPJ copilot:** watches 12-month income, shows the monthly difference in reais (like §2.1), hands off to a partner accountant | Very high (thousands of reais a year) | **Medium** in content, **low** in personal monitoring | Accountants become partners, and they pay for good referrals |
| **D. Self-made CLT benefits:** "pay yourself a salary" in reais, plus how much to set aside this month for leão, INSS, 13º, férias, emergency | High (answers the #1 pain: instability) | **None found** in Brazil | Simple to build. The value is in the habit, every month. |
| **E. Comprovante de renda:** monthly or annual income report (PDF) with each payment at PTAX and taxes paid; document pack for a DECORE | High at specific moments (renting, credit, visas) | **None found** | Comes for free once A and B exist. Strong word of mouth. |
| **F. Fee audit:** what each provider really cost you, and what switching would save | Medium–high | **Low** (comparators only quote today's rate) | Neutral across providers. Fintech referral income, disclosed. |
| **G. Invoices and collections** linked to payments and tax | Medium–high | **Medium** | Only valuable together with A–C, so it's a supporting feature |
| **H. Real hourly rate counting unpaid time** (built) | High for hourly and fixed-price work | **Low** for the insight, **high** for plain timers | Already done |

**The core insight:** our moat is **seeing the whole picture for one person**. That means every client, every provider, and Brazilian tax, in Portuguese. Banks and fintechs won't do it, because they'd have to show competitors' data. Accountants won't, because they're paid per company and per filing.

## 5. The proposal

**Positioning:**
- *"Ganhômetro: quanto sobra de verdade para quem ganha em dólar. Em reais, depois de taxas e impostos. E o leão em dia."*
- For AI trainers the message stays the same: *"quanto cada plataforma paga de verdade"*.
- The name already fits both audiences.

**The app for freelancers, in five parts:**

| Part | What the user sees | Builds on |
|---|---|---|
| **1. Recebimentos** | Every payment in: client, amount, currency, which provider, reais that arrived. Quick add on the phone, or **import the provider's CSV statement**. Wise's API doesn't give statement access for Brazilian personal accounts ([Wise docs](https://docs.wise.com/guides/developer/auth-and-security/personal-api-token)), so files first, Open Finance later. | Payments (next sprint) |
| **2. Quanto sobra** | Monthly: gross → platform fees → spread/fees → tax → INSS → **net in reais**. Per client, and per hour if they track time. | Dashboard (built) |
| **3. Leão** | PF: carnê-leão for the month, DARF amount and due date, reminders. CNPJ: DAS estimate on export revenue, pro-labore, Fator R check. **The PF-or-CNPJ monitor** with the yearly difference. Annual summary for the IRPF. | 2026 tax model from the spreadsheet |
| **4. Reservas** | "Pay yourself" a fixed monthly salary in reais. "How much to set aside this month" for leão, INSS, 13º, férias and emergencies, with progress. Ganhômetro never holds money: it tells you what to move. | New, small |
| **5. Documentos** | **Income report PDF** for landlords and banks, the DECORE pack for the accountant, **invoices and timesheets in English**, the payment reminder, the dispute pack for platforms | PDF engine (planned) |

The timer and real hourly rate remain for people paid by the hour or by project, and for AI trainers.

**What not to build:** a payment account or wallet, NFS-e issuing, bookkeeping, a job marketplace, full project management. Others do these well, and partnering is cheaper.

**Business model:**
- **Free:** up to 2 clients, payments, "quanto sobra" for the month, real hourly rate.
- **Pro, R$ 14,90/month** (the price promised to the waitlist): unlimited clients, Leão, Reservas, alerts, documents, the PF-or-CNPJ monitor.
- **Pro Freelancer, R$ 24,90–29,90** (decide after launch, with data): invoices, multiple currencies, the income report.
- **Referral income, always disclosed** and never affecting the numbers shown:
  - partner accountants (opening a CNPJ, DECORE);
  - fintechs (switching provider);
  - insurers (health insurance for PJs).

  For people crossing the CNPJ threshold, one accounting referral can be worth more than a year of subscription. Terms to negotiate.

## 6. How to get there

### Phase 0: validate while building (2–3 weeks, low cost)

1. **Rewrite the `/freelancers` page** around "quanto sobra" and "leão em dia", with the example from §2.1. Track the signup rate in Umami.
2. **Two more questions on the signup form** (both optional):
   - "Como você recebe?" PF / CNPJ / não sei;
   - "Quanto recebe por mês?" in brackets.

   This tells us who needs the PF-or-CNPJ copilot.
3. **Fake-door buttons** on the page, to measure clicks before building:
   - "Quero meu comprovante de renda";
   - "Vale a pena abrir CNPJ?"
4. **Three free calculators** that rank on Google and lead into the app:
   - "Quanto sobra do meu dólar?";
   - "PF ou CNPJ em 2026?" (with the 2026 rules);
   - "Quanto separar para o leão este mês?"
5. **10–15 interviews** found through r/brdev, LinkedIn and "trabalhar para gringa" groups. Ask:
   - how they receive money;
   - how they handle carnê-leão or their accountant;
   - whether they've had trouble proving income;
   - what they'd pay for.
6. **Decision rule:**
   - if the freelancer page converts at least 70% as well as the AI-trainer page, the founding sale includes freelancers;
   - if "Vale a pena abrir CNPJ?" or "comprovante de renda" gets clicks from at least 15% of visitors, those features move up.

### Phase 1: build (reordered sprints)

The new order puts money and tax before projects and invoices, because the research shows that's where the value and the gap are.

| Sprint | Deliverable | For whom |
|---|---|---|
| 3 | **Payments** (quick add + CSV import from Wise, Payoneer, Upwork), fees per payment, PTAX table and daily job; **Quanto sobra** dashboard; real rate from money received; underpayment check | Everyone |
| 4 | **Leão:** PF carnê-leão from receipts, DARF reminders; CNPJ estimate (DAS on exports, pro-labore); **PF-or-CNPJ monitor**. Accountant review starts here. | Everyone, mainly freelancers |
| 5 | **Reservas** and "pay yourself a salary"; late-payment alerts; email (Resend); weekly summary | Everyone |
| 6 | Projects (hourly or fixed price), monthly retainers, time without a client; **invoices** with due dates, partial payments and money owed | Freelancers |
| 7 | **Documents:** income report, DECORE pack, invoice and timesheet in English, payment reminder, dispute pack | Everyone |
| 8 | Fee audit; import from Toggl and Clockify; running timer in the tab title | Freelancers |
| 9 | Plans and checkout (Mercado Pago), Pro limits | — |
| 10 | Admin area, data export and deletion, install as an app, QA on real phones | — |

### Phase 2: partnerships (start in Phase 0, Gabriel leads the Brazilian side)

- **One or two accounting firms specialized in service exports:**
  - review our tax engine;
  - take CNPJ referrals;
  - offer DECORE at a fair price to our users.
- **Fintech referral programs** (Wise, Nomad/Husky, Remessa Online, Payoneer), shown only in the neutral fee audit.
- **An insurer or broker** for health insurance for PJs.

### Phase 3: reach

- **Creators:** YouTube and TikTok channels about "ganhar em dólar" and "trabalhar para gringa".
- **Communities:** dev and design communities, LinkedIn.
- **Search:** the free calculators.
- **Word of mouth:** the income report spreads it, every time someone rents a flat.

## 7. Risks and how to handle them

| Risk | How to handle it |
|---|---|
| A fintech (Husky/Nomad, Wise) adds tax reports | Stay neutral across all providers. Most people use more than one. Focus on the person (PF and small CNPJ), not on moving money. |
| Accountants see us as a threat | Send them clients. We do the monthly picture; they do the filing. |
| Tax errors | Accountant review before launch. Always "estimativa". Show the rule used and its source. |
| Manual entry fatigue | CSV import, a 5-minute monthly routine, reminders. Open Finance (e.g. Pluggy) later; pricing to check. |
| Mixing two audiences dilutes the launch | One engine, two landing pages and messages. The founding sale goes to whichever converts better. |
| Freelancers are scattered and hard to reach | Free calculators for search, creators, and dev communities. Measure cost per signup by channel. |
| Sensitive financial data | The same promise as today: time and money only, LGPD export and deletion, no bank passwords. |

## 8. Decisions for Xinning

1. **Positioning:** for freelancers, lead with "quanto sobra + leão em dia", not the timer?
2. **Build order:** payments and tax first (sprints 3–5), then projects and invoices (sprint 6)?
3. **Price:** launch with one Pro at R$ 14,90, and decide on a Pro Freelancer tier after launch?
4. **Accountant:** ask Gabriel to find an accounting firm specialized in service exports, for the review and the partnership.
5. **Phase 0:** start now (landing page rewrite, signup questions, fake doors, interviews)?

## Sources

- HUG freelancer survey, 2026: [CartaCapital](https://www.cartacapital.com.br/do-micro-ao-macro/freelancers-brasil-necessidade-desafios-pesquisa/), [Xataka](https://www.xataka.com.br/carreira/trabalho-freelancer-avanca-no-brasil-impulsionado-pelo-desemprego-pesquisa-revela-que-metade-atua-necessidade-e-74-enfrentam-instabilidade)
- Deel international hiring, 2025: [Exame](https://exame.com/carreira/fuga-de-cerebros-demanda-internacional-por-profissionais-brasileiros-cresce-53/)
- TechFX Brazilian Global Salary: [Olhar Digital](https://olhardigital.com.br/2025/03/20/pro/brasileiros-podem-triplicar-salarios-trabalhando-para-o-exterior-diz-pesquisa/), [TI Inside](https://tiinside.com.br/25/11/2025/eua-lideram-contratacoes-de-devs-brasileiros-com-salarios-de-ate-us-110-mil-por-ano-2/)
- Developers abroad (100k): [Telesíntese](https://telesintese.com.br/payoneer-e-husky-focam-nos-profissionais-que-recebem-do-exterior/)
- Husky clients and volume: [Finsiders](https://finsidersbrasil.com.br/reportagem-exclusiva-fintechs/com-operacoes-integradas-nomad-e-husky-planejam-novas-solucoes)
- Service exports 2025: [Exame](https://exame.com/economia/exportacoes-de-servicos-batem-recorde-e-alcancam-us-518-bi-em-2025/)
- Remessa Online / Ipsos: [PR Newswire](https://www.prnewswire.com/br/comunicados-para-a-imprensa/remessa-online-aponta-o-crescente-desejo-de-trabalho-internacional-entre-brasileiros-e-demanda-de-cambio-confiavel-302570849.html)
- Undeclared freelancer debt case: [Estado de Minas](https://www.em.com.br/emfoco/2026/04/19/trabalhei-como-freelancer-por-2-anos-sem-declarar-nada-hoje-devo-r-47-000-a-receita-federal/)
- Receiving costs and IOF: [FreelaSemCrise](https://www.freelasemcrise.com.br/guias/recebimento-internacional), [ARQ](https://www.arqfinance.com/articles/receber-pagamentos-internacionais-freelancer-brasil/), [Fizen](https://blog.fizen.io/como-receber-pagamento-do-exterior-freelancer-2026/), [Exiap](https://exiap.com.br/guias/remessa-online-transferencia-internacional)
- PJ taxes for developers: [Agilize](https://agilize.com.br/artigos/?p=4080), [Jornal Contábil](https://jornalcontabil.com.br/noticia/tributacao-pj-trabalha-exterior-guia-2026/), [Contabilidade.com (accountant prices)](https://contabilidade.com/blog/quanto-custa-um-contador-para-pj-em-2026-precos-servicos-e-o-que-esta-incluso/)
- Tax reform calendar (CBS/IBS): [Company Hero](https://www.companyhero.com/blog/reforma-tributaria-cbs-ibs)
- Late payments: [MediaPost (Remote 2025)](https://mediapost.com/publications/article/415441/payments-to-agencies-freelancers-increasingly-del.html), [Agiled (Bonsai data)](https://agiled.app/statistics/late-payment-statistics)
- Proof of income: [QuintoAndar](https://www.quintoandar.com.br/guias/?p=2279805), [Contábeis (DECORE)](https://www.contabeis.com.br/noticias/60419/decore-como-emitir-e-utilizar-a-declaracao-para-profissionais-autonomos/), [Agilize (DECORE price)](https://agilize.com.br/blog/gestao-contabil-e-fiscal/decore/)
- Competitors: [FreelancerBR](https://www.freelancerbr.com/), [TaskRush](https://taskrush.com.br/ferramenta-para-freelancer/), [Bonsai alternatives](https://thecfoclub.com/tools/best-bonsai-alternatives/), [Company Hero + Deel](https://startups.com.br/negocios/company-hero-e-deel-levam-beneficios-a-pjs-que-trabalham-para-o-exterior/), [Husky by Nomad](https://www.nomadglobal.com/conteudos/o-que-e-husky-by-nomad)
- US analogs: [Lili](https://fintechfutures.com/?p=15228966), [Keeper](https://www.finder.com/best-tax-software/keeper-tax)
- Wise API limits: [Wise docs](https://docs.wise.com/guides/developer/auth-and-security/personal-api-token)
- Open Finance aggregator: [Pluggy](https://finsidersbrasil.com.br/negocios-em-fintechs/na-pluggy-chegou-a-hora-de-plugar-o-open-finance-regulado)
