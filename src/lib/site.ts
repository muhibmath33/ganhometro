// Site-wide settings. Values that are still pending from Xinning fall back to a
// visible placeholder so they are easy to spot before launch (see README).

export const site = {
  name: "Ganhômetro",
  title: "Ganhômetro — quanto cada plataforma paga de verdade",
  description:
    "Conte o tempo pago e o não pago (diretrizes, testes, espera), veja seu ganho real por hora em reais e saiba quando um pagamento atrasou. Com estimativa do carnê-leão incluída.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  // Suggested in the handoff; it only receives mail once forwarding is set up (README, step 7).
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contato@ganhometro.com.br",
  // Legal name (and CPF/CNPJ, if desired) of the data controller, shown in the privacy policy.
  controller: process.env.NEXT_PUBLIC_CONTROLLER_NAME || "[NOME DO RESPONSÁVEL]",
  legalUpdatedAt: "26 de outubro de 2026",
  // Signup bonus, built by bonus/build_carne_leao.py. The download link stays hidden until
  // NEXT_PUBLIC_BONUS_READY=true (after the accountant review, see README).
  bonus: {
    ready: process.env.NEXT_PUBLIC_BONUS_READY === "true",
    href: "/Carne-leao-2026-Ganhometro.xlsx",
    label: "Baixe a planilha grátis: Carnê-leão 2026 para quem recebe em dólar",
  },
};
