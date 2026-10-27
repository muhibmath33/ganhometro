// Text for the founding offer page (/fundador, /en/founding).
import type { Locale } from "./config";

const pt = {
  metaTitle: "Oferta de fundador | Ganhômetro",
  metaDescription: "1 ano de Ganhômetro Pro por R$ 99, a partir do lançamento. Pagamento único por Pix ou cartão.",
  badge: "Oferta de fundador",
  title: "1 ano de Ganhômetro Pro por R$ 99",
  lead: "Pagamento único por Pix ou cartão, sem renovação automática. O seu ano de Pro começa no lançamento, em {date}.",
  leadNoDate: "Pagamento único por Pix ou cartão, sem renovação automática. O seu ano de Pro começa no lançamento.",
  included: "O que vem no Pro",
  email: "Seu e-mail",
  emailHint: "Use o mesmo e-mail com que vai entrar no app: o Pro fica ligado a ele.",
  button: "Pagar R$ 99 com Mercado Pago",
  paying: "Abrindo o Mercado Pago…",
  secure: "O pagamento é feito no Mercado Pago. O Ganhômetro não vê nem guarda dados do seu cartão.",
  terms: "Ao pagar, você concorda com os termos de uso e a política de privacidade.",
  closed: "A oferta de fundador está encerrada. Obrigado pelo interesse!",
  back: "Voltar ao início",
  results: {
    approved: "Pagamento aprovado! Quando você entrar no app com {email}, o Pro já estará ativo.",
    pending: "Pagamento em análise. Assim que o Mercado Pago confirmar, o Pro fica ligado ao seu e-mail.",
    failure: "O pagamento não foi concluído. Você pode tentar de novo.",
  },
  errors: { email: "Confira o e-mail.", closed: "A oferta não está disponível agora.", generic: "Algo deu errado. Tente de novo em instantes." },
};

export type FoundingDictionary = typeof pt;

const en: FoundingDictionary = {
  metaTitle: "Founding offer | Ganhômetro",
  metaDescription: "1 year of Ganhômetro Pro for R$ 99, starting at launch. One payment by Pix or card.",
  badge: "Founding offer",
  title: "1 year of Ganhômetro Pro for R$ 99",
  lead: "One payment by Pix or card, no automatic renewal. Your year of Pro starts at launch, on {date}.",
  leadNoDate: "One payment by Pix or card, no automatic renewal. Your year of Pro starts at launch.",
  included: "What Pro includes",
  email: "Your email",
  emailHint: "Use the email you'll sign in to the app with: Pro is tied to it.",
  button: "Pay R$ 99 with Mercado Pago",
  paying: "Opening Mercado Pago…",
  secure: "Payment happens on Mercado Pago. Ganhômetro never sees or stores your card details.",
  terms: "By paying, you agree to the terms of use and the privacy policy.",
  closed: "The founding offer has ended. Thank you for your interest!",
  back: "Back to the home page",
  results: {
    approved: "Payment approved! When you sign in to the app with {email}, Pro will already be on.",
    pending: "Payment under review. As soon as Mercado Pago confirms it, Pro is tied to your email.",
    failure: "The payment didn't go through. You can try again.",
  },
  errors: { email: "Check the email address.", closed: "The offer isn't available right now.", generic: "Something went wrong. Please try again in a moment." },
};

export const getFoundingDictionary = (locale: Locale): FoundingDictionary => (locale === "en" ? en : pt);
