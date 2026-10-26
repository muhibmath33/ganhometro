import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/app/OnboardingForm";
import { Card } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { profileLocale, requireUser } from "@/lib/app/session";

async function Onboarding() {
  const { profile } = await requireUser({ onboarded: false });
  if (profile.onboarded_at) redirect("/app");
  const t = getAppDictionary(profileLocale(profile));

  return (
    <Card className="mx-auto w-full max-w-xl">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[24px] font-extrabold">{t.onboarding.title}</h1>
        <p className="m-0 text-[15px] text-ink-soft">{t.onboarding.lead}</p>
      </div>
      <OnboardingForm t={t} defaultWork={profile.work_type} />
    </Card>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <Onboarding />
    </Suspense>
  );
}
