import { Suspense } from "react";
import Link from "next/link";
import { Card } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { describeSource } from "@/lib/app/sources";
import { profileLocale, requireUser } from "@/lib/app/session";

async function Today() {
  const { supabase, profile } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const { data: sources } = await supabase
    .from("income_sources")
    .select("*")
    .is("archived_at", null)
    .order("created_at");

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{t.today.title}</h1>
        <p className="m-0 text-[15px] text-ink-soft">{t.today.hello}</p>
      </div>

      <Card className="border-dashed">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-tint px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] text-amber-ink uppercase">
            {t.common.soon}
          </span>
          <p className="m-0 text-[15px] text-ink-soft">{t.today.timerSoon}</p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-[17px] font-bold">{t.today.yourSources}</h2>
          <Link href="/app/fontes" className="text-[14px] font-semibold">
            {t.today.manage}
          </Link>
        </div>
        {sources && sources.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {sources.map((s) => (
              <li key={s.id} className="flex flex-col gap-0.5 rounded-[12px] bg-paper px-4 py-3">
                <span className="text-[15px] font-bold">{s.name}</span>
                <span className="text-[13px] text-ink-soft">{describeSource(s, t, locale)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Link href="/app/fontes" className="text-[15px] font-semibold">
            {t.today.addFirst}
          </Link>
        )}
      </Card>
    </>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={null}>
      <Today />
    </Suspense>
  );
}
