# Waitlist emails (Brevo)

Two emails, each in Portuguese and English. Brevo picks the language from the `LANGUAGE` contact attribute that the site saves (`pt-BR` or `en`).

1. **Confirmation (double opt-in):** sent right after signup if double opt-in is on (recommended).
2. **Welcome + bonus:** sent once the contact is confirmed and added to the "Waitlist" list.

> **Bonus links:** send the spreadsheet and guide links only **after the accountant review** (same rule as the site's `NEXT_PUBLIC_BONUS_READY`). Until then, use the welcome email without the bonus block.
> Links below use `https://ganhometro.com.br`; when testing on Vercel, use the `vercel.app` address.

---

## 1. Confirmation email (double opt-in)

Brevo requires the `{{ doubleoptin }}` tag as the button link.

### PT-BR
- **Assunto:** Confirme seu e-mail para entrar na lista do Ganhômetro
- **Pré-visualização:** Falta um clique.

> Oi!
>
> Falta só um clique para você entrar na lista de acesso antecipado do Ganhômetro.
>
> **[Confirmar meu e-mail]({{ doubleoptin }})**
>
> Se não foi você que se cadastrou, é só ignorar este e-mail.
>
> Equipe Ganhômetro

### EN
- **Subject:** Confirm your email to join the Ganhômetro waitlist
- **Preview:** One click to go.

> Hi!
>
> You're one click away from joining the Ganhômetro early-access waitlist.
>
> **[Confirm my email]({{ doubleoptin }})**
>
> If you didn't sign up, just ignore this email.
>
> The Ganhômetro team

---

## 2. Welcome + bonus email

### PT-BR
- **Assunto:** Você está na lista do Ganhômetro (e sua planilha do carnê-leão chegou)
- **Pré-visualização:** Acesso antecipado grátis e desconto de fundador.

> Oi!
>
> Obrigado por entrar na lista do Ganhômetro. Você vai receber acesso antecipado grátis e um desconto de fundador antes de todo mundo.
>
> **Seu presente** *(enviar só depois da revisão do contador)*
> - [Planilha: Carnê-leão 2026 para quem recebe em dólar](https://ganhometro.com.br/Carne-leao-2026-Ganhometro.xlsx): lance seus pagamentos em dólar e veja o imposto estimado e o vencimento do DARF de cada mês.
> - [Guia rápido em PDF](https://ganhometro.com.br/Guia-Carne-leao-2026-Ganhometro.pdf): as regras de 2026 em duas páginas.
>
> São estimativas e não substituem um contador.
>
> **Enquanto o app não chega,** experimente a [calculadora de ganho real por hora](https://ganhometro.com.br/#calculadora). Coloque os números da sua última semana e veja quanto a plataforma pagou de verdade.
>
> Uma pergunta: **qual plataforma você usa mais, e qual é a sua maior dor com ela?** Responda este e-mail. Lemos todas as respostas e elas ajudam a decidir o que construir primeiro.
>
> Equipe Ganhômetro

### EN
- **Subject:** You're on the Ganhômetro waitlist (plus your carnê-leão spreadsheet)
- **Preview:** Free early access and a founder discount.

> Hi!
>
> Thanks for joining the Ganhômetro waitlist. You'll get free early access and a founder discount before anyone else.
>
> **Your gift** *(send only after the accountant review)*
> - [Spreadsheet: Carnê-leão 2026 for people paid in dollars](https://ganhometro.com.br/Carne-leao-2026-Ganhometro.xlsx) (in Portuguese): enter your dollar payments and see each month's estimated tax and DARF due date.
> - [Quick guide (PDF, in Portuguese)](https://ganhometro.com.br/Guia-Carne-leao-2026-Ganhometro.pdf): the 2026 rules on two pages.
>
> These are estimates and don't replace an accountant.
>
> **Until the app is ready,** try the [real hourly rate calculator](https://ganhometro.com.br/en#calculadora). Enter last week's numbers and see what the platform really paid.
>
> One question: **which platform do you use most, and what's your biggest pain with it?** Just reply to this email. We read every answer, and it helps us decide what to build first.
>
> The Ganhômetro team

---

## 3. Setup in Brevo (once the account exists)

1. **Templates:** Campaigns → Templates → **New template**. Create four: `DOI PT`, `DOI EN`, `Welcome PT`, `Welcome EN`. Paste the texts above. For the DOI templates, set the button link to `{{ doubleoptin }}`.
2. **Double opt-in on the site:** in Vercel, set these, then redeploy:
   - `BREVO_DOI_TEMPLATE_ID`: the ID of `DOI PT`
   - `BREVO_DOI_TEMPLATE_ID_EN`: the ID of `DOI EN` (optional; English signups use it)
   - `BREVO_DOI_REDIRECT_URL`: for example `https://ganhometro.com.br/?confirmado=1`
3. **Automation:** Automations → **Create** → "Contact added to list" → list **Waitlist**. Add a condition **LANGUAGE is en**:
   - yes → send `Welcome EN`
   - no → send `Welcome PT`
4. **Sender:** use `contato@ganhometro.com.br` once the domain and email forwarding exist, and authenticate the domain (SPF/DKIM/DMARC) so emails don't land in spam.
