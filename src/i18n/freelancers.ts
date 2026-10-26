// Text for the /freelancers landing page: only what differs from the main (AI trainer) page.
// Merged over pt.ts / en.ts by getDictionary(locale, "freelancers"). Arrays replace whole lists.
import type { Dictionary } from "./pt";

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const ptFreelancers: DeepPartial<Dictionary> = {
  meta: {
    title: "Ganhômetro — quanto cada cliente paga de verdade",
    description:
      "Para freelancers que recebem em dólar: conte as horas faturadas e as não faturadas (propostas, reuniões, revisões), veja seu ganho real por hora em reais e saiba quando um pagamento atrasou.",
    ogTitle: "Descubra quanto cada cliente paga de verdade, por hora, em reais.",
    ogTagline: "Para freelancers que recebem em dólar · Acesso antecipado grátis",
  },
  hero: {
    badge: "Para freelancers que recebem em dólar: devs, designers, tradutores, redatores",
    title: "Descubra quanto cada cliente paga de verdade, por hora, em reais.",
    lead: "Conte as horas faturadas e as não faturadas (propostas, reuniões, revisões), veja seu ganho real por hora depois de taxas e câmbio, e saiba quando um pagamento atrasou. Com estimativa do carnê-leão incluída.",
    note: "Grátis no acesso antecipado. Nunca guardamos o conteúdo dos seus projetos.",
    freelancers: "Também serve para quem treina IA na Mercor, Outlier, DataAnnotation e outras.",
  },
  example: {
    platformA: "Cliente A",
    platformB: "Cliente B",
    advertises: "combinado {rate}",
    detail: "{paid}h faturadas · {unpaid}h {unpaidWord} · US$ {received}",
    unpaidOne: "não faturada",
    unpaidMany: "não faturadas",
    legendPaid: "Tempo faturado",
    legendUnpaid: "Tempo não faturado",
    verdict: "O Cliente A paga mais por hora no papel, mas o B rendeu mais de verdade.",
  },
  problem: {
    title: "O valor por hora combinado não é o que você ganha.",
    lead: "Você cobra pelas horas de projeto. Propostas, reuniões, revisões e cobrança ficam por sua conta, e quase ninguém mede.",
    items: [
      { title: "Propostas e reuniões", text: "Horas escrevendo propostas, em calls e trocando e-mails antes de qualquer hora faturada." },
      { title: "Revisões sem fim", text: "Ajustes depois da entrega, \"só mais uma alteração\" e retrabalho que não entra na fatura." },
      { title: "Taxas e câmbio", text: "Plataforma, PayPal, Wise e spread do câmbio levam uma parte de cada pagamento." },
      { title: "Pagamento atrasado", text: "Cada cliente paga em um prazo diferente. Fica difícil perceber quando uma fatura não foi paga." },
    ],
  },
  calculator: {
    lead: "Coloque os números de uma semana com um cliente e veja quanto ele pagou de verdade.",
    fields: {
      listed: "Valor por hora combinado (US$/h)",
      received: "Valor recebido (US$)",
      paid: "Horas faturadas",
      unpaid: "Horas não faturadas",
      rate: "Cotação do dólar (R$)",
    },
    hint: "Horas não faturadas: propostas, reuniões, revisões, e-mails e cobrança. Os valores iniciais são só um exemplo.",
    messages: {
      gapLess: "{n}% a menos que o combinado",
      gapMore: "{n}% a mais que o combinado",
      gapSame: "Igual ao combinado",
      unpaidShare: "{n}% das suas horas não foram faturadas",
    },
    gapTitle: "Comparado ao valor combinado",
    unpaidTitle: "Tempo não faturado",
  },
  how: {
    steps: [
      { title: "Adicione seus clientes", text: "Clientes diretos ou plataformas como Upwork e Fiverr, com o valor combinado e quando costumam pagar." },
      { title: "Conte o tempo", text: "Um toque para começar. Marque se é hora faturada ou não faturada, como propostas, reuniões e revisões." },
      { title: "Veja seu ganho real", text: "Registre os pagamentos e veja quanto cada cliente paga de verdade, em reais, e quando algo atrasou." },
    ],
  },
  features: {
    items: [
      { title: "Ganho real por cliente e projeto", text: "Dinheiro recebido dividido por todas as horas, faturadas ou não. Compare clientes lado a lado.", soon: false },
      { title: "Tempo faturado x não faturado", text: "Marque propostas, reuniões, revisões e cobrança e veja para onde vai o seu tempo.", soon: false },
      { title: "Detector de pagamento a menor", text: "Compara horas faturadas x valor recebido e mostra possíveis diferenças para você conferir com o cliente.", soon: false },
      { title: "Alerta de pagamento atrasado", text: "Informe quando cada cliente costuma pagar e saiba na hora quando uma fatura atrasou.", soon: false },
      { title: "Quanto você perde em câmbio e taxas", text: "Compare o dólar que o cliente pagou com os reais que chegaram e veja o custo real de cada serviço de recebimento.", soon: true },
      { title: "Alerta dos R$ 5 mil", text: "Aviso antes de passar do limite de isenção do mês, com a estimativa do carnê-leão que você vai pagar.", soon: false },
      { title: "Quando vale abrir CNPJ?", text: "Compare quanto você pagaria pelo carnê-leão e como empresa no Simples Nacional, com seus números reais.", soon: true },
      { title: "Registro de horas e cobrança em inglês", text: "Registro das horas em PDF e uma mensagem educada em inglês para cobrar o cliente.", soon: false },
      { title: "Alerta de queda de renda", text: "Avisa quando um cliente paga bem menos que o normal ou quando quase toda a sua renda depende de um só.", soon: true },
      { title: "INSS em dia", text: "Lembrete da guia mensal e simulação dos planos de contribuição para você não ficar sem proteção.", soon: true },
    ],
  },
  privacy: {
    text: "Projetos de clientes costumam ser confidenciais. O Ganhômetro foi feito para você nunca precisar compartilhá-los.",
    points: [
      "Não guardamos conteúdo, arquivos nem mensagens dos seus projetos.",
      "Nunca pedimos login das plataformas, senha do gov.br ou do banco.",
      "Exporte ou apague seus dados quando quiser, conforme a LGPD.",
      "Seus ganhos são privados. Nada é compartilhado sem a sua permissão.",
    ],
  },
  plans: {
    free: {
      items: ["Cronômetro com tempo faturado e não faturado", "Até 2 clientes ou plataformas", "Ganho real por hora em reais", "Resumo semanal"],
    },
    pro: {
      items: [
        "Clientes e plataformas ilimitados, ganho por projeto e histórico completo",
        "Detector de pagamento a menor e alerta de atraso",
        "Quanto você perde em câmbio e taxas (em breve)",
        "Alerta antes de passar dos R$ 5 mil, estimativa do carnê-leão e lembretes",
        "Quando vale abrir CNPJ? (em breve)",
        "Registro de horas em PDF e mensagem de cobrança em inglês",
        "Alerta de queda de renda e INSS em dia (em breve)",
      ],
    },
  },
  faq: {
    items: [
      { q: "O Ganhômetro é ligado a alguma plataforma?", a: "Não. É independente e não tem relação com nenhuma plataforma de freelance ou de treinamento de IA. Você registra seu próprio tempo e seus pagamentos." },
      { q: "Vocês acessam minhas contas ou meus projetos?", a: "Não. Guardamos apenas o tempo que você registra e os pagamentos que você informa. Nunca pedimos login das plataformas." },
      { q: "Serve para quem trabalha por projeto, com preço fechado?", a: "Sim. Registre as horas do projeto e o valor recebido, e o Ganhômetro mostra quanto aquele projeto pagou por hora de verdade." },
      { q: "Funciona com Upwork, Fiverr e clientes diretos?", a: "Sim. Você adiciona cada cliente ou plataforma, com o valor combinado e quando costuma pagar." },
      { q: "A estimativa do carnê-leão é oficial?", a: "É uma estimativa baseada nas regras publicadas, revisada por um contador antes do lançamento. Você mesmo gera e paga o DARF." },
      { q: "Quanto vai custar?", a: "Haverá um plano grátis. O Pro libera clientes ilimitados, alertas, o registro em PDF e o carnê-leão, com desconto para quem entrar na lista." },
    ],
  },
  final: {
    title: "Saiba quanto cada cliente paga de verdade.",
  },
};

export const enFreelancers: DeepPartial<Dictionary> = {
  meta: {
    title: "Ganhômetro — what each client really pays",
    description:
      "For freelancers in Brazil paid in dollars: track billed and unbilled hours (proposals, calls, revisions), see your real hourly rate in reais and know when a payment is late.",
    ogTitle: "Find out what each client really pays, per hour, in reais.",
    ogTagline: "For freelancers paid in dollars · Free early access",
  },
  hero: {
    badge: "For freelancers in Brazil paid in dollars: developers, designers, translators, writers",
    title: "Find out what each client really pays, per hour, in reais.",
    lead: "Track billed and unbilled hours (proposals, calls, revisions), see your real hourly rate after fees and exchange, and know when a payment is late. Carnê-leão (Brazilian income tax) estimate included.",
    note: "Free during early access. We never store your project content.",
    freelancers: "Also works for AI trainers on Mercor, Outlier, DataAnnotation and more.",
  },
  example: {
    platformA: "Client A",
    platformB: "Client B",
    advertises: "agreed {rate}",
    detail: "{paid}h billed · {unpaid}h {unpaidWord} · US$ {received}",
    unpaidOne: "unbilled",
    unpaidMany: "unbilled",
    legendPaid: "Billed time",
    legendUnpaid: "Unbilled time",
    verdict: "Client A pays more per hour on paper, but B actually earned you more.",
  },
  problem: {
    title: "Your agreed hourly rate isn't what you earn.",
    lead: "You bill for project hours. Proposals, calls, revisions and chasing payments are on you, and almost nobody measures them.",
    items: [
      { title: "Proposals and calls", text: "Hours writing proposals, on calls and answering emails before any billable hour." },
      { title: "Endless revisions", text: "Changes after delivery, \"just one more tweak\" and rework that never makes it onto the invoice." },
      { title: "Fees and exchange", text: "The platform, PayPal, Wise and the exchange spread each take a cut of every payment." },
      { title: "Late payments", text: "Each client pays on different terms. It's hard to notice when an invoice wasn't paid." },
    ],
  },
  calculator: {
    lead: "Enter one week's numbers with one client and see what they really paid.",
    fields: {
      listed: "Agreed hourly rate (US$/h)",
      received: "Amount received (US$)",
      paid: "Billed hours",
      unpaid: "Unbilled hours",
      rate: "Dollar rate (R$)",
    },
    hint: "Unbilled hours: proposals, calls, revisions, emails and chasing payments. The starting values are just an example.",
    messages: {
      gapLess: "{n}% less than agreed",
      gapMore: "{n}% more than agreed",
      gapSame: "Same as agreed",
      unpaidShare: "{n}% of your hours weren't billed",
    },
    gapTitle: "Compared to the agreed rate",
    unpaidTitle: "Unbilled time",
  },
  how: {
    steps: [
      { title: "Add your clients", text: "Direct clients or platforms like Upwork and Fiverr, with the agreed rate and when they usually pay." },
      { title: "Track your time", text: "One tap to start. Mark it as billed or unbilled, like proposals, calls and revisions." },
      { title: "See your real earnings", text: "Log your payments and see what each client really pays, in reais, and when something was late." },
    ],
  },
  features: {
    items: [
      { title: "Real rate per client and project", text: "Money received divided by all hours, billed or not. Compare clients side by side.", soon: false },
      { title: "Billed vs. unbilled time", text: "Tag proposals, calls, revisions and chasing payments, and see where your time goes.", soon: false },
      { title: "Underpayment detector", text: "Compares billed hours with the amount received and shows possible differences to check with the client.", soon: false },
      { title: "Late payment alert", text: "Set when each client usually pays and know right away when an invoice is late.", soon: false },
      { title: "What you lose on exchange and fees", text: "Compare the dollars the client paid with the reais that arrived and see the real cost of each payment service.", soon: true },
      { title: "R$ 5k alert", text: "A heads-up before you pass the monthly tax-free limit, with the carnê-leão estimate you'll pay.", soon: false },
      { title: "When should you open a company?", text: "Compare what you'd pay through the carnê-leão and as a company under Simples Nacional, with your real numbers.", soon: true },
      { title: "Hours record and payment reminder in English", text: "A PDF record of your hours and a polite message in English to chase the client.", soon: false },
      { title: "Income drop alert", text: "Warns you when a client pays much less than usual or when almost all your income depends on one.", soon: true },
      { title: "INSS up to date", text: "A reminder for the monthly INSS (Brazilian social security) payment and a comparison of contribution plans.", soon: true },
    ],
  },
  privacy: {
    text: "Client projects are often confidential. Ganhômetro was built so you never have to share them.",
    points: [
      "We don't store your project content, files or messages.",
      "We never ask for platform logins, or for gov.br or bank passwords.",
      "Export or delete your data whenever you want, as the LGPD (Brazil's data protection law) guarantees.",
      "Your earnings are private. Nothing is shared without your permission.",
    ],
  },
  plans: {
    free: {
      items: ["Timer with billed and unbilled time", "Up to 2 clients or platforms", "Real hourly rate in reais", "Weekly summary"],
    },
    pro: {
      items: [
        "Unlimited clients and platforms, per-project rates and full history",
        "Underpayment detector and late payment alert",
        "What you lose on exchange and fees (soon)",
        "Alert before you pass R$ 5k, carnê-leão estimate and reminders",
        "When should you open a company? (soon)",
        "PDF hours record and payment reminder in English",
        "Income drop alert and INSS reminders (soon)",
      ],
    },
  },
  faq: {
    items: [
      { q: "Is Ganhômetro affiliated with any platform?", a: "No. It's independent and has no connection to any freelance or AI training platform. You log your own time and payments." },
      { q: "Do you access my accounts or my projects?", a: "No. We only store the time you log and the payments you enter. We never ask for platform logins." },
      { q: "Does it work for fixed-price projects?", a: "Yes. Log the project hours and the amount received, and Ganhômetro shows what that project really paid per hour." },
      { q: "Does it work with Upwork, Fiverr and direct clients?", a: "Yes. You add each client or platform, with the agreed rate and when they usually pay." },
      { q: "Is the carnê-leão estimate official?", a: "It's an estimate based on the published rules, reviewed by an accountant before launch. You generate and pay the DARF (the tax payment slip) yourself." },
      { q: "How much will it cost?", a: "There will be a free plan. Pro unlocks unlimited clients, alerts, the PDF record and the carnê-leão, with a discount for people on the waitlist." },
    ],
  },
  final: {
    title: "Find out what each client really pays.",
  },
};
