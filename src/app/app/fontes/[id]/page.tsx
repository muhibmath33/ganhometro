import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SourceForm } from "@/components/app/SourceForm";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { profileLocale, requireUser } from "@/lib/app/session";

async function EditSource({ params }: { params: PageProps<"/app/fontes/[id]">["params"] }) {
  const { id } = await params;
  const { supabase, profile } = await requireUser();
  const t = getAppDictionary(profileLocale(profile));
  // RLS only returns the row if it belongs to this user.
  const { data: source } = await supabase.from("income_sources").select("*").eq("id", id).maybeSingle();
  if (!source) notFound();

  return (
    <Card className="mx-auto w-full max-w-xl">
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
  );
}

export default function EditSourcePage({ params }: PageProps<"/app/fontes/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditSource params={params} />
    </Suspense>
  );
}
