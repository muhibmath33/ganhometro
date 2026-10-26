import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { LogoIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Admin — Ganhômetro",
  robots: { index: false, follow: false },
};

// Private waitlist dashboard. The page shell is static; the gate (cookie check + Brevo data)
// runs per request inside <Suspense>.
export default function AdminPage() {
  return (
    <div lang="en" className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1120px] items-center gap-2.5 px-6 py-3.5">
          <span className="flex size-[30px] items-center justify-center rounded-[8px] bg-brand">
            <LogoIcon size={16} color="#FFFFFF" strokeWidth={2.2} />
          </span>
          <span className="text-[17px] font-extrabold">Ganhômetro</span>
          <span className="rounded-full bg-amber-tint px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] text-amber-ink uppercase">
            Admin
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-[1120px] px-6 py-8">
        <Suspense fallback={<p className="text-[14px] text-muted">Loading…</p>}>
          <AdminGate />
        </Suspense>
      </main>
    </div>
  );
}
