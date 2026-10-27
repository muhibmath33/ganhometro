import Link from "next/link";
import { Suspense } from "react";
import { TimeImport } from "@/components/app/TimeImport";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { loadTimerSources } from "@/lib/app/projects";
import { profileLocale, requireUser } from "@/lib/app/session";

async function ImportHours() {
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const s = t.timeImport;
  const { active } = await loadTimerSources(supabase, user.id);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-[22px] font-extrabold">{s.title}</h1>
        <Link href="/app/registro" className="text-[14px] font-semibold">
          {t.common.cancel}
        </Link>
      </div>
      <p className="m-0 text-[15px] text-ink-soft">{s.lead}</p>
      <p className="m-0 text-[13px] text-ink-soft">{s.how}</p>
      <p className="m-0 rounded-[10px] bg-brand-tint px-3 py-2 text-[13px] text-brand">{s.privacy}</p>
      <TimeImport t={t} locale={locale} timeZone={profile.timezone} sources={active.map((src) => ({ id: src.id, name: src.name }))} />
    </Card>
  );
}

export default function ImportHoursPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ImportHours />
    </Suspense>
  );
}
