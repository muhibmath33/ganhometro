export const locales = ["pt-BR", "en"] as const;
export type Locale = (typeof locales)[number];

// The same page in each language. Used by the language switch, hreflang tags and the sitemap.
export const routes = {
  home: { "pt-BR": "/", en: "/en" },
  freelancers: { "pt-BR": "/freelancers", en: "/en/freelancers" },
  privacy: { "pt-BR": "/privacidade", en: "/en/privacy" },
  terms: { "pt-BR": "/termos", en: "/en/terms" },
  calculators: { "pt-BR": "/calculadoras", en: "/en/calculators" },
  calcTakeHome: { "pt-BR": "/calculadoras/quanto-sobra", en: "/en/calculators/take-home-pay" },
  calcCompany: { "pt-BR": "/calculadoras/pf-ou-cnpj", en: "/en/calculators/individual-or-company" },
  calcCarneLeao: { "pt-BR": "/calculadoras/carne-leao", en: "/en/calculators/carne-leao" },
} as const;

export type RouteKey = keyof typeof routes;

export function alternates(key: RouteKey, locale: Locale) {
  return {
    canonical: routes[key][locale],
    languages: {
      "pt-BR": routes[key]["pt-BR"],
      en: routes[key].en,
      "x-default": routes[key]["pt-BR"],
    },
  };
}

// "{n}% less" + { n: 43 } -> "43% less"
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}
