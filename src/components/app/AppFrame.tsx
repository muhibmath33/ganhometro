import Link from "next/link";
import { getAppDictionary } from "@/i18n/app";
import { getSession, profileLocale } from "@/lib/app/session";
import { appConfigured } from "@/lib/supabase/server";
import { HtmlLang } from "../HtmlLang";
import { LogoIcon } from "../icons";
import { AppNav } from "./AppNav";

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
  return <Header />;
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
              { href: "/app", label: t.nav.today },
              { href: "/app/fontes", label: t.nav.sources },
              { href: "/app/ajustes", label: t.nav.settings },
            ]}
          />
        )}
      </Header>
      <main lang={locale} className="mx-auto flex max-w-[960px] flex-col gap-5 px-5 py-6">
        {children}
      </main>
    </>
  );
}
