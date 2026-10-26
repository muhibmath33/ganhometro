import Link from "next/link";
import { Suspense } from "react";
import { StatementImport } from "@/components/app/StatementImport";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { profileLocale, requireUser } from "@/lib/app/session";

async function ImportStatement() {
  const { supabase, profile } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const { data } = await supabase.from("income_sources").select("id, name").is("archived_at", null).order("created_at");
  const sources = data ?? [];

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-[22px] font-extrabold">{t.statement.title}</h1>
        <Link href="/app/pagamentos" className="text-[14px] font-semibold">
          {t.statement.back}
        </Link>
      </div>
      <p className="m-0 text-[14px] leading-[1.55] text-ink-soft">{t.statement.lead}</p>
      {sources.length ? (
        <StatementImport t={t} locale={locale} sources={sources} />
      ) : (
        <Link href="/app/fontes" className="text-[15px] font-semibold">
          {t.statement.noSources}
        </Link>
      )}
    </Card>
  );
}

export default function ImportStatementPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ImportStatement />
    </Suspense>
  );
}
