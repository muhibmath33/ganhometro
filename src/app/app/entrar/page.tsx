import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/app/ui";
import { SignInForm } from "@/components/app/SignInForm";
import { getAppDictionary } from "@/i18n/app";
import { getSession } from "@/lib/app/session";

async function SignIn({ searchParams }: { searchParams: PageProps<"/app/entrar">["searchParams"] }) {
  const { user } = await getSession();
  if (user) redirect("/app");
  const params = await searchParams;
  const locale = params.lang === "en" ? "en" : "pt-BR";
  const t = getAppDictionary(locale);

  return (
    <Card className="mx-auto w-full max-w-md">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[24px] font-extrabold">{t.signIn.title}</h1>
        <p className="m-0 text-[15px] text-ink-soft">{t.signIn.lead}</p>
      </div>
      {params.erro === "link" && (
        <p role="alert" className="m-0 text-[14px] font-semibold text-amber-ink">
          {t.signIn.linkFailed}
        </p>
      )}
      <SignInForm t={t} locale={locale} />
    </Card>
  );
}

export default function SignInPage({ searchParams }: PageProps<"/app/entrar">) {
  return (
    <Suspense fallback={<Card className="mx-auto h-64 w-full max-w-md">{null}</Card>}>
      <SignIn searchParams={searchParams} />
    </Suspense>
  );
}
