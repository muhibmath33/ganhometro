import Link from "next/link";
import { Suspense } from "react";
import { setSourceArchived } from "@/app/app/actions";
import { SourceForm } from "@/components/app/SourceForm";
import { Card } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { describeSource, type Source } from "@/lib/app/sources";
import { profileLocale, requireUser } from "@/lib/app/session";

async function Sources({ searchParams }: { searchParams: PageProps<"/app/fontes">["searchParams"] }) {
  const { supabase, profile } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const params = await searchParams;
  const { data } = await supabase.from("income_sources").select("*").order("created_at");
  const sources = data ?? [];
  const active = sources.filter((s) => !s.archived_at);
  const archived = sources.filter((s) => s.archived_at);

  const row = (s: Source, isArchived: boolean) => (
    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-paper px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[15px] font-bold">
          {s.name} <span className="text-[12px] font-semibold text-muted">· {t.source.kinds[s.kind]}</span>
        </span>
        <span className="text-[13px] text-ink-soft">{describeSource(s, t, locale)}</span>
      </div>
      <div className="flex items-center gap-2">
        {!isArchived && (
          <Link href={`/app/fontes/${s.id}`} className="rounded-[9px] border border-line bg-white px-3 py-2 text-[13px] font-semibold no-underline">
            {t.common.edit}
          </Link>
        )}
        <form action={setSourceArchived}>
          <input type="hidden" name="id" value={s.id} />
          <input type="hidden" name="archive" value={isArchived ? "0" : "1"} />
          <button type="submit" className="cursor-pointer rounded-[9px] border border-line bg-white px-3 py-2 font-sans text-[13px] font-semibold text-ink-soft">
            {isArchived ? t.common.restore : t.common.archive}
          </button>
        </form>
      </div>
    </li>
  );

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{t.sources.title}</h1>
        <p className="m-0 max-w-[640px] text-[15px] text-ink-soft">{t.sources.lead}</p>
      </div>

      {params.limite === "1" && (
        <p role="alert" className="m-0 text-[14px] font-semibold text-amber-ink">
          {t.source.freeLimit}
        </p>
      )}

      <Card>
        <h2 className="m-0 text-[17px] font-bold">{t.sources.active}</h2>
        {active.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">{active.map((s) => row(s, false))}</ul>
        ) : (
          <p className="m-0 text-[14px] text-muted">{t.source.empty}</p>
        )}
      </Card>

      <Card>
        <h2 className="m-0 text-[17px] font-bold">{t.sources.addTitle}</h2>
        <SourceForm t={t} />
      </Card>

      {archived.length > 0 && (
        <Card>
          <h2 className="m-0 text-[17px] font-bold">{t.source.archived}</h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">{archived.map((s) => row(s, true))}</ul>
        </Card>
      )}
    </>
  );
}

export default function SourcesPage({ searchParams }: PageProps<"/app/fontes">) {
  return (
    <Suspense fallback={null}>
      <Sources searchParams={searchParams} />
    </Suspense>
  );
}
