import type { Metadata } from "next";
import { Suspense } from "react";
import { AppFrame, AppShellFallback } from "@/components/app/AppFrame";

export const metadata: Metadata = {
  title: "Ganhômetro",
  robots: { index: false, follow: false },
};

// The logged-in app. Everything that reads the session renders per request inside <Suspense>.
export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="min-h-screen bg-paper">
      <Suspense fallback={<AppShellFallback />}>
        <AppFrame>{children}</AppFrame>
      </Suspense>
    </div>
  );
}
