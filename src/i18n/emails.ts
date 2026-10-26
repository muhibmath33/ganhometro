// Text for the app's emails (src/lib/email/templates.ts), in the user's language.
import type { Locale } from "./config";

const pt = {
  darf: {
    subject: { 5: "Lembrete: o DARF de {month} vence em 5 dias", 1: "Lembrete: o DARF de {month} vence amanhã" },
    subjectCnpj: { 5: "Lembrete: o DAS de {month} vence em 5 dias", 1: "Lembrete: o DAS de {month} vence amanhã" },
    body: "O DARF do carnê-leão de {month}, de {amount}, vence em {due}.",
    bodyCnpj: "O DAS e os encargos do pró-labore de {month} somam cerca de {amount} e vencem em {due}.",
    how: "Gere o DARF no Carnê-Leão Web, dentro do e-CAC (código 0190).",
    howCnpj: "O DAS oficial é gerado no PGDAS-D, normalmente pelo seu contador.",
    paid: "Já pagou? Marque como pago no app para não receber outro lembrete deste mês.",
    button: "Ver no Ganhômetro",
  },
  late: {
    subject: "{source}: pagamento possivelmente atrasado",
    body: "{source} costuma pagar {schedule}. O pagamento esperado em {payday} ainda não está registrado, e você tem horas pagas desde {since}.",
    next: "Já recebeu? Registre o pagamento. Ainda não chegou? Confira no painel da plataforma.",
    button: "Registrar pagamento",
    schedules: { weekly: "toda {weekday}", biweekly: "a cada duas semanas, às {weekday}s", monthly: "todo dia {day}" },
    weekdays: ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"],
  },
  weekly: {
    subject: "Sua semana no Ganhômetro: {from} a {to}",
    title: "Sua semana: {from} a {to}",
    hours: "{total} trabalhadas: {paid} pagas e {unpaid} não pagas ({share} do tempo).",
    noHours: "Nenhuma hora registrada na semana.",
    platforms: "Por plataforma",
    month: "Em {month} até agora",
    received: "Recebido: {amount}",
    kept: "Sobra estimada: {amount}",
    noPayments: "Nenhum pagamento registrado em {month} ainda.",
    attention: "Atenção",
    late: "{source}: o pagamento esperado em {payday} ainda não está registrado.",
    button: "Abrir o painel",
  },
  footer: {
    why: "Você recebe este e-mail porque usa o Ganhômetro.",
    settings: "Escolher quais e-mails receber",
    estimate: "Valores de imposto são estimativas, não orientação contábil.",
  },
};

export type EmailDictionary = typeof pt;

const en: EmailDictionary = {
  darf: {
    subject: { 5: "Reminder: your {month} DARF is due in 5 days", 1: "Reminder: your {month} DARF is due tomorrow" },
    subjectCnpj: { 5: "Reminder: your {month} DAS is due in 5 days", 1: "Reminder: your {month} DAS is due tomorrow" },
    body: "Your carnê-leão DARF for {month}, {amount}, is due {due}.",
    bodyCnpj: "Your DAS and pro-labore taxes for {month} come to about {amount} and are due {due}.",
    how: "Generate the DARF in the Carnê-Leão Web, inside the e-CAC (code 0190).",
    howCnpj: "The official DAS is generated in the PGDAS-D, usually by your accountant.",
    paid: "Already paid? Mark it as paid in the app and you won't get another reminder for this month.",
    button: "See it in Ganhômetro",
  },
  late: {
    subject: "{source}: payment possibly late",
    body: "{source} usually pays {schedule}. The payment expected on {payday} isn't logged yet, and you have paid hours since {since}.",
    next: "Already received it? Log the payment. Not yet? Check the platform's dashboard.",
    button: "Log payment",
    schedules: { weekly: "every {weekday}", biweekly: "every other {weekday}", monthly: "on day {day} of each month" },
    weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
  weekly: {
    subject: "Your week in Ganhômetro: {from} to {to}",
    title: "Your week: {from} to {to}",
    hours: "{total} worked: {paid} paid and {unpaid} unpaid ({share} of your time).",
    noHours: "No hours logged this week.",
    platforms: "By platform",
    month: "{month} so far",
    received: "Received: {amount}",
    kept: "Estimated take-home: {amount}",
    noPayments: "No payments logged in {month} yet.",
    attention: "Heads-up",
    late: "{source}: the payment expected on {payday} isn't logged yet.",
    button: "Open the dashboard",
  },
  footer: {
    why: "You're getting this email because you use Ganhômetro.",
    settings: "Choose which emails you get",
    estimate: "Tax amounts are estimates, not tax advice.",
  },
};

export function getEmailDictionary(locale: Locale): EmailDictionary {
  return locale === "en" ? en : pt;
}
