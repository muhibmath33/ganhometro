import { LogoIcon } from "./icons";

const links = [
  { href: "calculadora", label: "Calculadora" },
  { href: "como", label: "Como funciona" },
  { href: "recursos", label: "Recursos" },
  { href: "privacidade", label: "Privacidade" },
  { href: "duvidas", label: "Dúvidas" },
];

// On the home page anchors stay relative ("#como") so the UTM query string is kept.
export function SiteHeader({ home = false }: { home?: boolean }) {
  const base = home ? "" : "/";
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-6 py-3.5">
        <a
          href={home ? "#topo" : "/"}
          className="flex items-center gap-2.5 text-ink no-underline hover:text-ink"
        >
          <span className="flex size-[34px] items-center justify-center rounded-[9px] bg-brand">
            <LogoIcon size={18} color="#FFFFFF" strokeWidth={2.2} />
          </span>
          <span className="text-[19px] font-extrabold tracking-[-0.01em]">
            Ganhômetro
          </span>
        </a>
        <nav aria-label="Principal" className="flex flex-wrap items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={`${base}#${l.href}`}
              className="px-3 py-2.5 text-[14px] font-medium text-ink-soft no-underline"
            >
              {l.label}
            </a>
          ))}
          <a
            href={`${base}#lista`}
            className="ml-1.5 rounded-[9px] bg-ink px-4 py-3 text-[14px] font-bold text-white no-underline"
          >
            Entrar na lista
          </a>
        </nav>
      </div>
    </header>
  );
}
