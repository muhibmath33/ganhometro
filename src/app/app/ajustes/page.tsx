import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/app/actions";
import { SettingsForm } from "@/components/app/SettingsForm";
import { TaxSettingsForm } from "@/components/app/TaxSettingsForm";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { isPro, profileLocale, requireUser } from "@/lib/app/session";

async function Settings() {
  const { user, profile } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);

  return (
    <>
      <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{t.settings.title}</h1>
      <Card className="max-w-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="m-0 text-[17px] font-bold">{t.settings.sources}</h2>
            <p className="m-0 text-[14px] text-ink-soft">{t.settings.sourcesLead}</p>
          </div>
          <Link href="/app/fontes" className="rounded-[9px] border border-line bg-white px-3 py-2 text-[14px] font-semibold no-underline">
            {t.settings.manage}
          </Link>
        </div>
      </Card>
      <Card className="max-w-xl">
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 text-[17px] font-bold">{t.settings.taxTitle}</h2>
          <p className="m-0 text-[14px] text-ink-soft">{t.settings.taxLead}</p>
        </div>
        <TaxSettingsForm
          t={t}
          values={{
            taxMode: profile.tax_mode === "cnpj" ? "cnpj" : "pf",
            inssPlan: profile.inss_plan,
            dependents: profile.dependents,
            accountantCost: Number(profile.accountant_cost),
          }}
        />
      </Card>
      <Card className="max-w-xl">
        <SettingsForm t={t} locale={locale} work={profile.work_type} />
      </Card>
      <Card className="max-w-xl">
        <h2 className="m-0 text-[17px] font-bold">{t.settings.account}</h2>
        <p className="m-0 text-[15px] text-ink-soft">{t.settings.signedInAs.replace("{email}", user.email)}</p>
        <p className="m-0 text-[15px] text-ink-soft">
          {t.settings.plan}: <strong className="text-ink">{t.settings.plans[isPro(profile) ? "pro" : "free"]}</strong>
        </p>
        <form action={signOut}>
          <button type="submit" className="min-h-11 cursor-pointer rounded-[10px] border border-line bg-white px-4 font-sans text-[15px] font-semibold text-ink">
            {t.nav.signOut}
          </button>
        </form>
      </Card>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Settings />
    </Suspense>
  );
}
