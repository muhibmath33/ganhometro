import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { setProjectArchived } from "@/app/app/actions";
import { ProjectForm } from "@/components/app/ProjectForm";
import { SourceForm } from "@/components/app/SourceForm";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { describeProject, type Project } from "@/lib/app/projects";
import { profileLocale, requireUser } from "@/lib/app/session";

const smallButton = "cursor-pointer rounded-[9px] border border-line bg-white px-3 py-2 font-sans text-[13px] font-semibold text-ink-soft";

async function EditSource({ params }: { params: PageProps<"/app/fontes/[id]">["params"] }) {
  const { id } = await params;
  const { supabase, profile } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  // RLS only returns the rows if they belong to this user.
  const [{ data: source }, { data: projectRows }] = await Promise.all([
    supabase.from("income_sources").select("*").eq("id", id).maybeSingle(),
    supabase.from("projects").select("*").eq("source_id", id).order("created_at"),
  ]);
  if (!source) notFound();
  const projects = projectRows ?? [];
  const active = projects.filter((p) => !p.archived_at);
  const archived = projects.filter((p) => p.archived_at);

  const row = (p: Project, isArchived: boolean) => (
    <li key={p.id} className="flex flex-col gap-3 rounded-[12px] bg-paper px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[15px] font-bold">{p.name}</span>
          <span className="text-[13px] text-ink-soft">{describeProject(p, source.currency, t, locale)}</span>
        </div>
        <form action={setProjectArchived}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="archive" value={isArchived ? "0" : "1"} />
          <button type="submit" className={smallButton}>
            {isArchived ? t.common.restore : t.common.archive}
          </button>
        </form>
      </div>
      {!isArchived && (
        <details>
          <summary className="cursor-pointer text-[13px] font-semibold text-brand">{t.project.editTitle}</summary>
          <div className="pt-3">
            <ProjectForm t={t} sourceId={source.id} currency={source.currency} project={p} />
          </div>
        </details>
      )}
    </li>
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h1 className="m-0 text-[22px] font-extrabold">
            {t.sources.editTitle}: {source.name}
          </h1>
          <Link href="/app/fontes" className="text-[14px] font-semibold">
            {t.common.cancel}
          </Link>
        </div>
        <SourceForm t={t} source={source} />
      </Card>

      <Card>
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-[17px] font-bold">{t.project.title}</h2>
          <p className="m-0 text-[14px] text-ink-soft">{t.project.lead}</p>
        </div>
        {active.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">{active.map((p) => row(p, false))}</ul>
        ) : (
          <p className="m-0 text-[14px] text-muted">{t.project.empty}</p>
        )}
        <details open={!projects.length}>
          <summary className="cursor-pointer text-[15px] font-bold marker:text-brand">{t.project.add}</summary>
          <div className="pt-4">
            <ProjectForm t={t} sourceId={source.id} currency={source.currency} />
          </div>
        </details>
        {archived.length > 0 && (
          <>
            <h3 className="m-0 text-[15px] font-bold">{t.project.archived}</h3>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">{archived.map((p) => row(p, true))}</ul>
          </>
        )}
      </Card>
    </div>
  );
}

export default function EditSourcePage({ params }: PageProps<"/app/fontes/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditSource params={params} />
    </Suspense>
  );
}
