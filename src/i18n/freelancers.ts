// Text for the /freelancers landing page: only what differs from the main (AI trainer) page.
// Merged over pt.ts / en.ts by getDictionary(locale, "freelancers"). Arrays replace whole lists.
// Positioning (docs/freelancer-market.md): how much is really left of the dollars, in reais, and the leão up to date.
import type { Locale } from "./config";
import type { Dictionary } from "./pt";

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const ptFreelancers: DeepPartial<Dictionary> = {
  meta: {
    title: "Ganhômetro — quanto sobra de verdade de quem ganha em dólar",
    description:
      "Para freelancers e PJs que recebem do exterior: veja quanto sobra em reais depois de taxas, câmbio, INSS e imposto, fique em dia com o carnê-leão e descubra se já vale abrir CNPJ.",
    ogTitle: "Quanto sobra de verdade do seu dólar, em reais.",
    ogTagline: "Para quem recebe do exterior · Acesso antecipado grátis",
  },
  hero: {
    badge: "Para quem recebe do exterior: devs, designers, tradutores e PJs de empresas de fora",
    title: "Quanto sobra de verdade do seu dólar, em reais.",
    lead: "Veja quanto fica com você depois de taxas, câmbio, INSS e imposto. Fique em dia com o carnê-leão e descubra se já vale abrir CNPJ, com os seus números.",
    note: "Grátis no acesso antecipado. Nunca pedimos senha de banco nem de plataforma.",
    freelancers: "Também mostra quanto cada cliente paga por hora de verdade, contando propostas, reuniões e revisões.",
  },
  problem: {
    title: "O valor combinado não é o que fica com você.",
    lead: "Entre o cliente pagar e o dinheiro virar reais na sua conta, uma parte fica pelo caminho. Quase ninguém sabe quanto.",
    items: [
      { title: "Taxas e câmbio", text: "Plataforma, PayPal, Wise e o spread do câmbio levam uma parte de cada pagamento, sem aparecer na fatura." },
      { title: "Imposto como pessoa física", text: "Acima de R$ 7.350 por mês, o carnê-leão chega a 27,5%. Com CNPJ, a mesma renda pode pagar bem menos." },
      { title: "Renda que muda todo mês", text: "Mês bom, mês fraco, e 13º, férias e INSS por sua conta. Difícil saber quanto dá para gastar." },
      { title: "Cliente que atrasa", text: "Cada cliente paga num prazo diferente. Fica fácil esquecer uma fatura vencida." },
    ],
  },
  calculator: {
    title: "Quanto sobra do seu dólar?",
    lead: "Coloque quanto recebe por mês e veja o que fica com você, como pessoa física ou com CNPJ.",
  },
  how: {
    steps: [
      { title: "Registre o que recebe", text: "Cada pagamento, de qualquer cliente ou plataforma, em dólar, euro ou libra. Leva segundos." },
      { title: "Veja quanto sobra", text: "Em reais, depois de taxas, câmbio, INSS e imposto. Por cliente e por mês." },
      { title: "Fique em dia com o leão", text: "O carnê-leão do mês com a cotação certa, lembrete do DARF e o aviso de quando o CNPJ compensa." },
    ],
  },
  features: {
    items: [
      { title: "Quanto sobra, em reais", text: "Bruto, taxas, câmbio, INSS e imposto, mês a mês e por cliente.", soon: false },
      { title: "Carnê-leão em dia", text: "O imposto do mês com a cotação que a Receita manda usar, e lembrete antes do prazo do DARF.", soon: false },
      { title: "PF ou CNPJ?", text: "Com a sua renda real, quanto você economizaria com CNPJ, e o aviso de quando passa a compensar.", soon: false },
      { title: "Faturas em inglês e cobrança", text: "Fatura e registro de horas em PDF, alerta de atraso e uma mensagem educada para cobrar o cliente.", soon: false },
      { title: "Quanto você perde em câmbio e taxas", text: "Compare o que o cliente pagou com os reais que chegaram e veja o custo real de cada serviço de recebimento.", soon: false },
      { title: "Ganho real por hora", text: "Dinheiro recebido dividido por todas as horas, faturadas ou não. Compare clientes lado a lado.", soon: false },
      { title: "Salário fixo e reservas", text: "Pague-se um salário todo mês e saiba quanto separar para 13º, férias, INSS e imposto.", soon: true },
      { title: "Comprovante de renda", text: "Um relatório com tudo o que você recebeu, em reais, para a imobiliária, o banco ou o contador.", soon: true },
    ],
  },
  privacy: {
    text: "Seus números são só seus. O Ganhômetro foi feito para você nunca precisar entregar senhas ou documentos dos clientes.",
    points: [
      "Não guardamos conteúdo, arquivos nem mensagens dos seus projetos.",
      "Nunca pedimos senha de banco, de plataforma ou do gov.br.",
      "Exporte ou apague seus dados quando quiser, conforme a LGPD.",
      "Seus ganhos são privados. Nada é compartilhado sem a sua permissão.",
    ],
  },
  plans: {
    free: {
      items: ["Até 2 clientes ou plataformas", "Quanto sobra do mês, em reais", "Ganho real por hora", "Resumo semanal"],
    },
    pro: {
      items: [
        "Clientes e plataformas ilimitados",
        "Carnê-leão todo mês, com lembrete do DARF",
        "PF ou CNPJ: quanto você economizaria, com seus números",
        "Alerta de pagamento atrasado e faturas em inglês",
        "Quanto você perde em câmbio e taxas",
        "Salário fixo e reservas (em breve)",
        "Comprovante de renda (em breve)",
      ],
    },
  },
  faq: {
    items: [
      { q: "Preciso ter CNPJ para usar?", a: "Não. Funciona para quem recebe como pessoa física e para quem tem CNPJ. Se você ainda não tem, o Ganhômetro mostra a partir de quando passaria a compensar." },
      { q: "Vocês abrem empresa ou fazem a minha contabilidade?", a: "Não. O Ganhômetro organiza seus números e faz as estimativas. Para abrir CNPJ e para a contabilidade você continua com um contador, e podemos indicar parceiros." },
      { q: "Serve para quem trabalha como PJ para uma empresa de fora?", a: "Sim. Você registra os pagamentos do mês e vê quanto sobra, o imposto da empresa e quanto separar para férias e 13º." },
      { q: "Vocês acessam minhas contas?", a: "Não. Você informa os pagamentos ou importa o extrato do serviço de recebimento. Nunca pedimos senha de banco, de plataforma ou do gov.br." },
      { q: "A estimativa de imposto é oficial?", a: "É uma estimativa com as regras publicadas de 2026, revisada por um contador antes do lançamento. Você mesmo gera e paga o DARF." },
      { q: "Quanto vai custar?", a: "Haverá um plano grátis. O Pro libera o carnê-leão, a comparação PF ou CNPJ e os alertas, com desconto para quem entrar na lista." },
    ],
  },
  final: {
    title: "Saiba quanto sobra de verdade do seu dólar.",
  },
};

export const enFreelancers: DeepPartial<Dictionary> = {
  meta: {
    title: "Ganhômetro — what's really left of the dollars you earn",
    description:
      "For freelancers and contractors in Brazil paid from abroad: see what's left in reais after fees, exchange, INSS and income tax, keep the carnê-leão up to date and find out if a company already pays off.",
    ogTitle: "What's really left of your dollars, in reais.",
    ogTagline: "For people paid from abroad · Free early access",
  },
  hero: {
    badge: "For people in Brazil paid from abroad: developers, designers, translators and contractors for foreign companies",
    title: "What's really left of your dollars, in reais.",
    lead: "See what you keep after fees, exchange, INSS and income tax. Keep the carnê-leão (monthly income tax) up to date and find out if opening a company already pays off, with your own numbers.",
    note: "Free during early access. We never ask for bank or platform passwords.",
    freelancers: "It also shows what each client really pays per hour, counting proposals, calls and revisions.",
  },
  problem: {
    title: "The agreed amount isn't what you keep.",
    lead: "Between the client paying and the money landing in reais, part of it disappears on the way. Almost nobody knows how much.",
    items: [
      { title: "Fees and exchange", text: "The platform, PayPal, Wise and the exchange spread each take a cut, and none of it shows on the invoice." },
      { title: "Tax as an individual", text: "Above R$ 7,350 a month, the carnê-leão reaches 27.5%. With a company, the same income can pay much less." },
      { title: "Income that changes every month", text: "Good months, slow months, and 13th salary, vacation and INSS are on you. Hard to know what you can spend." },
      { title: "Late-paying clients", text: "Each client pays on different terms. It's easy to forget an overdue invoice." },
    ],
  },
  calculator: {
    title: "How much of your dollars do you keep?",
    lead: "Enter what you receive each month and see what's left, as an individual or with a company.",
  },
  how: {
    steps: [
      { title: "Log what you receive", text: "Every payment, from any client or platform, in dollars, euros or pounds. Takes seconds." },
      { title: "See what's left", text: "In reais, after fees, exchange, INSS and income tax. Per client and per month." },
      { title: "Stay on top of tax", text: "This month's carnê-leão at the right exchange rate, a DARF reminder, and a heads-up when a company pays off." },
    ],
  },
  features: {
    items: [
      { title: "What's left, in reais", text: "Gross, fees, exchange, INSS and income tax, month by month and per client.", soon: false },
      { title: "Carnê-leão up to date", text: "This month's tax at the exchange rate the Receita requires, with a reminder before the DARF is due.", soon: false },
      { title: "Individual or company?", text: "With your real income: how much a company would save you, and a heads-up when it starts to pay off.", soon: false },
      { title: "Invoices in English and payment reminders", text: "Invoice and timesheet PDFs, late payment alerts and a polite message to chase the client.", soon: false },
      { title: "What you lose on exchange and fees", text: "Compare what the client paid with the reais that arrived and see the real cost of each payment service.", soon: false },
      { title: "Real hourly rate", text: "Money received divided by all hours, billed or not. Compare clients side by side.", soon: false },
      { title: "Fixed salary and reserves", text: "Pay yourself a salary every month and know what to set aside for 13th salary, vacation, INSS and tax.", soon: true },
      { title: "Proof of income", text: "A report of everything you received, in reais, for a landlord, a bank or your accountant.", soon: true },
    ],
  },
  privacy: {
    text: "Your numbers are yours. Ganhômetro was built so you never have to hand over passwords or client documents.",
    points: [
      "We don't store your project content, files or messages.",
      "We never ask for bank, platform or gov.br passwords.",
      "Export or delete your data whenever you want, as the LGPD (Brazil's data protection law) guarantees.",
      "Your earnings are private. Nothing is shared without your permission.",
    ],
  },
  plans: {
    free: {
      items: ["Up to 2 clients or platforms", "This month's take-home, in reais", "Real hourly rate", "Weekly summary"],
    },
    pro: {
      items: [
        "Unlimited clients and platforms",
        "Carnê-leão every month, with a DARF reminder",
        "Individual or company: what you'd save, with your numbers",
        "Late payment alerts and invoices in English",
        "What you lose on exchange and fees",
        "Fixed salary and reserves (soon)",
        "Proof of income (soon)",
      ],
    },
  },
  faq: {
    items: [
      { q: "Do I need a company (CNPJ) to use it?", a: "No. It works whether you're paid as an individual or through a company. If you don't have one yet, Ganhômetro shows from what income it would pay off." },
      { q: "Do you open companies or do my accounting?", a: "No. Ganhômetro organizes your numbers and makes the estimates. For opening a company and for accounting you keep working with an accountant, and we can suggest partners." },
      { q: "Does it work for contractors working for one foreign company?", a: "Yes. Log the monthly payments and see what's left, the company's taxes and what to set aside for vacation and 13th salary." },
      { q: "Do you access my accounts?", a: "No. You enter your payments or import your payment service's statement. We never ask for bank, platform or gov.br passwords." },
      { q: "Is the tax estimate official?", a: "It's an estimate with the published 2026 rules, reviewed by an accountant before launch. You generate and pay the DARF (the tax payment slip) yourself." },
      { q: "How much will it cost?", a: "There will be a free plan. Pro unlocks the carnê-leão, the individual-or-company comparison and the alerts, with a discount for people on the waitlist." },
    ],
  },
  final: {
    title: "Find out what's really left of your dollars.",
  },
};

// Sections that exist only on /freelancers: the example card in the hero and the feature vote.
const ptExtras = {
  netExample: {
    title: "Exemplo: US$ 3.000 por mês",
    caption: "cotação ilustrativa {rate} · estimativa",
    pf: "Como pessoa física",
    pj: "Com CNPJ no Simples",
    share: "fica {n}%",
    detail: "impostos e INSS {taxes} · taxas e custos {costs}",
    verdict: "Com CNPJ, sobram {diff} a mais por mês, cerca de {year} por ano.",
    legend: { kept: "Fica com você", taxes: "Impostos e INSS", costs: "Taxas e custos" },
  },
  calculatorsLink: "Mais calculadoras: PF ou CNPJ e o carnê-leão do mês",
  votes: {
    badge: "Em construção",
    title: "O que você quer primeiro?",
    lead: "Estamos decidindo a ordem. Toque no que faria mais diferença para você.",
    button: "Quero isso",
    done: "Anotado!",
    join: "Entre na lista para ser avisado",
    items: [
      { key: "income_report", title: "Comprovante de renda", text: "Um PDF com tudo o que você recebeu, em reais, para a imobiliária, o banco ou o contador (DECORE)." },
      { key: "salary", title: "Salário fixo e reservas", text: "Pague-se um salário todo mês e saiba quanto separar para 13º, férias, INSS e imposto." },
      { key: "invoices", title: "Faturas em inglês e cobrança", text: "Fatura e timesheet em PDF, alerta quando vence e uma mensagem educada para cobrar." },
      { key: "company_alert", title: "Aviso de quando abrir CNPJ", text: "Com a sua renda dos últimos 12 meses, o aviso do mês em que o CNPJ passa a compensar." },
    ],
  },
};

export type FreelancerExtras = typeof ptExtras;

const enExtras: FreelancerExtras = {
  netExample: {
    title: "Example: US$ 3,000 a month",
    caption: "illustrative rate {rate} · estimate",
    pf: "As an individual",
    pj: "With a Simples company",
    share: "keeps {n}%",
    detail: "taxes and INSS {taxes} · fees and costs {costs}",
    verdict: "With a company, you keep {diff} more a month, about {year} a year.",
    legend: { kept: "You keep", taxes: "Taxes and INSS", costs: "Fees and costs" },
  },
  calculatorsLink: "More calculators: individual or company, and this month's carnê-leão",
  votes: {
    badge: "In the works",
    title: "What do you want first?",
    lead: "We're deciding the order. Tap what would make the biggest difference for you.",
    button: "I want this",
    done: "Noted!",
    join: "Join the waitlist to hear when it's ready",
    items: [
      { key: "income_report", title: "Proof of income", text: "A PDF of everything you received, in reais, for a landlord, a bank or your accountant (DECORE)." },
      { key: "salary", title: "Fixed salary and reserves", text: "Pay yourself a salary every month and know what to set aside for 13th salary, vacation, INSS and tax." },
      { key: "invoices", title: "Invoices in English and reminders", text: "Invoice and timesheet PDFs, an alert when they're due and a polite message to chase payment." },
      { key: "company_alert", title: "Heads-up on opening a company", text: "From your last 12 months of income, a heads-up the month a company starts to pay off." },
    ],
  },
};

export function getFreelancerExtras(locale: Locale): FreelancerExtras {
  return locale === "en" ? enExtras : ptExtras;
}
