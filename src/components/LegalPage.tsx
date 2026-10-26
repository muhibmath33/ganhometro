import { site } from "@/lib/site";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-[760px] flex-col gap-4 px-6 pt-14 pb-20 text-[16px] leading-[1.65] text-ink-soft [&_h2]:m-0 [&_h2]:mt-6 [&_h2]:text-[22px] [&_h2]:leading-[1.3] [&_h2]:font-extrabold [&_h2]:tracking-[-0.01em] [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:m-0 [&_strong]:text-ink [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-6">
        <h1 className="m-0 text-[38px] leading-[1.1] font-extrabold tracking-[-0.02em] text-ink">
          {title}
        </h1>
        <p className="text-[14px] text-muted">Última atualização: {site.legalUpdatedAt}</p>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
