import Link from "next/link";
import { getAppDictionary } from "@/i18n/app";
import { getSession, profileLocale } from "@/lib/app/session";
import { appConfigured } from "@/lib/supabase/server";
import { HtmlLang } from "../HtmlLang";
import { LogoIcon } from "../icons";
import { AppNav } from "./AppNav";
import { PageSkeleton } from "./ui";

function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link href="/app" className="flex items-center gap-2.5 text-ink no-underline hover:text-ink">
          <span className="flex size-[30px] items-center justify-center rounded-[8px] bg-brand">
            <LogoIcon size={16} color="#FFFFFF" strokeWidth={2.2} />
          </span>
          <span className="text-[17px] font-extrabold">Ganhômetro</span>
        </Link>
        {children}
      </div>
    </header>
  );
}

export function AppShellFallback() {
  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-[960px] flex-col gap-5 px-5 py-6">
        <PageSkeleton />
      </main>
    </>
  );
}

// Reads the session (per request, inside the layout's <Suspense>), then renders the header in the
// user's language around the page.
export async function AppFrame({ children }: { children: React.ReactNode }) {
  if (!appConfigured()) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-[960px] px-5 py-8 text-[15px] text-ink-soft">
          {getAppDictionary("pt-BR").common.notConfigured}
        </main>
      </>
    );
  }
  const { user, profile } = await getSession();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const showNav = Boolean(user && profile?.onboarded_at);

  return (
    <>
      {locale === "en" && <HtmlLang lang="en" />}
      <Header>
        {showNav && (
          <AppNav
            items={[
              { href: "/app", label: t.nav.today, icon: "today" },
              { href: "/app/painel", label: t.nav.dashboard, icon: "dashboard" },
              { href: "/app/pagamentos", label: t.nav.payments, icon: "payments" },
              { href: "/app/impostos", label: t.nav.taxes, icon: "taxes" },
              { href: "/app/registro", label: t.nav.log, icon: "log", desktopOnly: true },
              { href: "/app/ajustes", label: t.nav.settings, icon: "settings", also: ["/app/fontes"] },
            ]}
          />
        )}
      </Header>
      {/* On phones the nav is a fixed tab bar, so leave room for it below the content. */}
      <main lang={locale} className={`mx-auto flex max-w-[960px] flex-col gap-5 px-5 pt-6 ${showNav ? "pb-28 sm:pb-6" : "pb-6"}`}>
        {children}
      </main>
    </>
  );
}
