import { getDictionary, routes, type Locale, type RouteKey } from "@/i18n";
import { LogoIcon } from "./icons";

const sections = [
  { id: "como", key: "how" },
  { id: "recursos", key: "features" },
  { id: "privacidade", key: "privacy" },
  { id: "duvidas", key: "faq" },
] as const;

const languages = [
  { locale: "pt-BR", short: "PT", name: "Português (Brasil)" },
  { locale: "en", short: "EN", name: "English" },
] as const;

// On a landing page anchors stay relative ("#como") so the UTM query string is kept.
export function SiteHeader({ locale, page }: { locale: Locale; page: RouteKey }) {
  const t = getDictionary(locale).nav;
  const home = page === "home" || page === "freelancers";
  const anchor = (id: string) => (home ? `#${id}` : `${routes.home[locale]}#${id}`);

  return (
    <header className="border-b border-line bg-white">
      {/* Phones: logo and language switch on the first row, menu below. Desktop: logo, menu, switch. */}
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-3 px-6 py-3.5">
        <a
          href={home ? "#topo" : routes.home[locale]}
          className="order-1 flex items-center gap-2.5 text-ink no-underline hover:text-ink"
        >
          <span className="flex size-[34px] items-center justify-center rounded-[9px] bg-brand">
            <LogoIcon size={18} color="#FFFFFF" strokeWidth={2.2} />
          </span>
          <span className="text-[19px] font-extrabold tracking-[-0.01em]">Ganhômetro</span>
        </a>
        <nav
          aria-label={t.label}
          className="order-3 flex w-full flex-wrap items-center gap-1 lg:order-2 lg:ml-auto lg:w-auto"
        >
          <a href={routes.calculators[locale]} className="px-3 py-2.5 text-[14px] font-medium text-ink-soft no-underline">
            {t.calculator}
          </a>
          {sections.map((s) => (
            <a
              key={s.id}
              href={anchor(s.id)}
              className="px-3 py-2.5 text-[14px] font-medium text-ink-soft no-underline"
            >
              {t[s.key]}
            </a>
          ))}
          <a
            href={anchor("lista")}
            className="ml-1.5 rounded-[9px] bg-ink px-4 py-3 text-[14px] font-bold text-white no-underline"
          >
            {t.cta}
          </a>
        </nav>
        <div
          role="group"
          aria-label={t.language}
          className="order-2 ml-auto flex items-center rounded-full border border-line bg-white p-0.5 lg:order-3 lg:ml-0"
        >
          {languages.map((l) => {
            const active = l.locale === locale;
            return (
              <a
                key={l.locale}
                href={routes[page][l.locale]}
                hrefLang={l.locale}
                lang={l.locale}
                title={l.name}
                aria-current={active ? "true" : undefined}
                className={`rounded-full px-2.5 py-2 text-[13px] leading-none font-bold no-underline ${
                  active ? "bg-ink text-white hover:text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                <span aria-hidden="true">{l.short}</span>
                <span className="sr-only">{l.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    </header>
  );
}
