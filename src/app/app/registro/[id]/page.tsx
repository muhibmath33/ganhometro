import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteEntry } from "@/app/app/actions";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { EntryForm } from "@/components/app/EntryForm";
import { Card, PageSkeleton } from "@/components/app/ui";
import { categoryName, getAppDictionary } from "@/i18n/app";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { dayKey, timeKey } from "@/lib/app/time";

async function EditEntry({ params }: { params: PageProps<"/app/registro/[id]">["params"] }) {
  const { id } = await params;
  const { supabase, profile } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const tz = profile.timezone;
  // RLS only returns the row if it belongs to this user.
  const { data: entry } = await supabase.from("time_entries").select("*").eq("id", id).maybeSingle();
  if (!entry) notFound();

  const [{ data: sourceRows }, { data: categoryRows }] = await Promise.all([
    supabase.from("income_sources").select("id, name, pay_model, archived_at").order("created_at"),
    supabase.from("categories").select("id, kind, name, preset, archived_at").order("sort"),
  ]);
  // Active ones, plus the entry's own source and category even if archived since.
  const sources = (sourceRows ?? [])
    .filter((s) => !s.archived_at || s.id === entry.source_id)
    .map((s) => ({ id: s.id, name: s.name, perTask: s.pay_model === "per_task" }));
  const categories = (categoryRows ?? [])
    .filter((c) => !c.archived_at || c.id === entry.category_id)
    .map((c) => ({ ...c, name: categoryName(c, locale) }));
  const start = new Date(entry.started_at);

  return (
    <Card className="mx-auto w-full max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-[22px] font-extrabold">{t.log.editTitle}</h1>
        <Link href="/app/registro" className="text-[14px] font-semibold">
          {t.common.cancel}
        </Link>
      </div>
      <EntryForm
        t={t}
        sources={sources}
        categories={categories}
        maxDate={dayKey(new Date(requestNow()), tz)}
        values={{
          id: entry.id,
          sourceId: entry.source_id,
          kind: entry.kind,
          categoryId: entry.category_id,
          date: dayKey(start, tz),
          start: timeKey(start, tz),
          end: entry.ended_at ? timeKey(new Date(entry.ended_at), tz) : "",
          units: entry.units,
          running: !entry.ended_at,
        }}
      />
      <hr className="m-0 border-0 border-t border-line" />
      <ConfirmDelete
        action={deleteEntry}
        id={entry.id}
        labels={{ button: t.entry.delete, question: t.entry.confirmDelete, confirm: t.entry.confirm, cancel: t.common.cancel }}
      />
    </Card>
  );
}

export default function EditEntryPage({ params }: PageProps<"/app/registro/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditEntry params={params} />
    </Suspense>
  );
}
