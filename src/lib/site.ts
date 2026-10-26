// Site-wide settings. Values that are still pending from Victor fall back to a
// visible placeholder so they are easy to spot before launch (see README).

export const site = {
  name: "Ganho Real",
  title: "Ganho Real — quanto cada plataforma paga de verdade",
  description:
    "Conte o tempo pago e o não pago (diretrizes, testes, espera), veja seu ganho real por hora em reais e saiba quando um pagamento atrasou. Com estimativa do carnê-leão incluída.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[SEU E-MAIL]",
  // Legal name (and CPF/CNPJ, if desired) of the data controller, shown in the privacy policy.
  controller: process.env.NEXT_PUBLIC_CONTROLLER_NAME || "[NOME DO RESPONSÁVEL]",
  legalUpdatedAt: "26 de outubro de 2026",
};
