# Payment provider: comparison and recommendation

**For:** Xinning and Gabriel. **Researched:** 26 Oct 2026. Fees change often; confirm on the provider's site before signing up.
**Situation:** Gabriel sells as an **individual (CPF, no CNPJ yet)**. Revenue goes to his personal bank account. Customers must be able to pay by **card and Pix**. Xinning needs **his own login** to see every sale, and the app needs **webhooks**.

## The fact that shapes the decision

**Recurring Pix (Pix Automático) is only for companies.** Banco Central rules (Resoluções BCB 360/361) say the receiver must be a legal entity. News reports add that institutions check the CNPJ, and some require at least 6 months of activity. ([fonte 1](https://finsidersbrasil.com.br/regulamentacao/bc-anuncia-regras-do-pix-automatico-servico-sera-lancado-em-outubro-de-2024/), [fonte 2](https://contadores.cnt.br/projetos/54/noticias/empresariais/2025/09/29/banco-central-exige-autorizacao-de-cnpj-no-uso-do-pix-automatico.html))

So while Gabriel has only a CPF:
- **One-time payments** work by **Pix or card**: the R$ 99 founding offer and the R$ 129 yearly plan.
- **Monthly auto-renewal** works by **card only**. Monthly Pix would mean emailing a new Pix charge every month.

## Comparison

Effective fee = what the provider keeps per sale, using the published standard rates (about R$ 5,10 per US$).

| | Mercado Pago | Stripe (Brazil) | Asaas | Kiwify / Hotmart | Paddle |
|---|---|---|---|---|---|
| Account with CPF only | Yes | Yes ("Individual" type, one verified CPF) | Yes (PF and PJ) | Yes (common for creators) | Unclear; built for companies |
| Pix (one-time) | 0,99% online | 1,19%, **invite only** | R$ 1,99 per charge | Same fee as card | Yes, one-time; Pix Automático reported Sept 2026 |
| Card | From 3,99% (30-day payout; faster payout costs more) | 3,99% + R$ 0,39 | 2,99% + R$ 0,49 | Kiwify 8,99% + R$ 2,49; Hotmart about 9,9% + R$ 1–2,49 | 5% + US$ 0,50 |
| Card subscriptions | Yes ("Assinaturas") | Yes (Billing, +0,7%) | Yes | Yes | Yes |
| **Fee on R$ 14,90/month** (card) | about R$ 0,59 (4%) | about R$ 1,09 (7%) | about R$ 0,94 (6%) | about R$ 3,83 (26%) | about R$ 3,30 (22%) |
| **Fee on R$ 99** (Pix / card) | R$ 0,98 / R$ 3,95 | R$ 1,18* / R$ 4,34 | R$ 1,99 / R$ 3,45 | about R$ 11,39 | about R$ 7,50 |
| Team login for Xinning | Yes: "Colaboradores" with roles | Yes: team members with roles; works from any country | To confirm | To confirm | Yes |
| Webhooks / API | Good | Excellent | Good | Basic (sale/refund events) | Excellent |
| Notes | Most familiar brand for Brazilian buyers | Best developer experience; Pix needs an invitation | Strong for boletos/Pix billing | Built-in affiliates (pay creators per sale) | Merchant of record (handles global taxes). Not needed when selling in Brazil, and expensive for low prices |

\* only if Stripe approves Pix for the account.

**Sources:**
- Mercado Pago: [Pix fees](https://www.mercadopago.com.br/ferramentas-para-vender/aceitar-pix), [collaborators](https://www.mercadopago.com.br/blog/gerenciar-multiplos-usuarios-conta-negocio), [fee overview (third party)](https://www.calculadoradetaxas.com.br/mercado-pago)
- Stripe: [pricing](https://stripe.com/en-br/pricing), [Brazil verification](https://support.stripe.com/questions/2026-updates-to-brazil-verification-requirements)
- Asaas: [fees](https://blog.asaas.com/taxas-asaas/), [subscriptions](https://central.ajuda.asaas.com/hc/pt-br/articles/31997100041371-Quais-s%C3%A3o-as-taxas-para-criar-cobran%C3%A7as-por-assinatura-recorrentes)
- Kiwify/Hotmart: [fee comparison (third party)](https://viniensina.com.br/taxas-plataformas-infoproduto/), [Kiwify fees (third party)](https://www.cakto.com.br/blog/taxas-kiwify)
- Paddle: [Pix docs](https://developer.paddle.com/concepts/payment-methods/pix/), [Pix Automático news](https://thepaypers.com/payments/news/paddle-billing-adds-pix-automatico-for-brazilian-payments), [pricing (third party)](https://apicostcalc.com/paddle.html)

## Recommendation

**Use Mercado Pago for both the founding sale and the launch.**
- **Cheapest:** the lowest fees for both Pix (0,99%) and card.
- **CPF is enough:** Gabriel can open it today with just his CPF.
- **Trusted:** it's the payment brand Brazilian buyers trust most.
- **Has what we need:** card subscriptions, collaborator logins with roles for Xinning, and webhooks for the app.

**How to sell each plan with Mercado Pago:**

| Plan | How customers pay | Renewal |
|---|---|---|
| Founding offer, R$ 99 (one time) | Pix or card (Checkout Pro) | None. The app emails an offer before the year ends. |
| Pro yearly, R$ 129 | Pix or card (one-time) | Reminder email with a new payment link |
| Pro monthly, R$ 14,90 | Card subscription | Automatic (card) |

**Second choice: Stripe.** It has a better API and team access, but Pix is invite-only and card fees are higher on small amounts.

**Not recommended for now:**
- **Paddle:** about 22% fee on the monthly plan, monthly payouts in dollars, and its main benefit (global tax handling) isn't needed for Brazil-only sales.
- **Kiwify/Hotmart:** about 26% on the monthly plan. Consider them only if paying creators per sale through built-in affiliates becomes important.

**Later, with a CNPJ** (6+ months old): add Pix Automático for monthly Pix renewals. Mercado Pago, Asaas and Pagar.me are reported to offer it.

## Open questions

1. **Gabriel:** does a CPF-only Mercado Pago account allow adding a collaborator? Some guides mention it under "Conta Negócio". Check in the app: Configurações → Seu negócio → Colaboradores.
2. **Taxes on revenue (for the accountant, not advice):** money received by Gabriel as an individual is his taxable income (carnê-leão for payments from individuals, possibly ISS). Ask when it's worth opening the CNPJ, and which tax regime fits a software subscription.
3. **Refunds and chargebacks:** who handles customer refund requests (Xinning through his collaborator login?), and what refund policy we state on the checkout page.
