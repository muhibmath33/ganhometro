// Site-wide settings that are the same in every language. Page text lives in src/i18n/.
// Values that are still pending fall back to a visible placeholder (see README).

export const site = {
  name: "Ganhômetro",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  // Suggested in the handoff; it only receives mail once forwarding is set up (README, step 7).
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contato@ganhometro.com.br",
  // Legal name (and CPF/CNPJ, if desired) of the data controller, shown in the privacy policy.
  controller: process.env.NEXT_PUBLIC_CONTROLLER_NAME || "[NOME DO RESPONSÁVEL]",
  // Signup bonus, built by bonus/build_carne_leao.py. The download link stays hidden until
  // NEXT_PUBLIC_BONUS_READY=true (after the accountant review, see README).
  bonus: {
    ready: process.env.NEXT_PUBLIC_BONUS_READY === "true",
    href: "/Carne-leao-2026-Ganhometro.xlsx",
  },
};
