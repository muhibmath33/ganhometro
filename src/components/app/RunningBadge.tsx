"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { formatClock } from "@/lib/app/time";
import { useNow } from "./useNow";

// While a timer runs: the time in the browser tab's title on every app page, and a badge in the header that
// leads back to Today (hidden on Today itself, which shows the big timer).
export function RunningBadge({ startedAt, label, serverNow, ariaLabel }: { startedAt: number; label: string; serverNow: number; ariaLabel: string }) {
  const now = useNow(serverNow, 1000);
  const pathname = usePathname();
  const clock = formatClock(now - startedAt);

  useEffect(() => {
    document.title = `${clock} · ${label}`;
  }, [clock, label]);
  // When the timer stops, the badge goes away and the tab gets its name back.
  useEffect(
    () => () => {
      document.title = "Ganhômetro";
    },
    [],
  );

  if (pathname === "/app") return null;
  return (
    <Link
      href="/app"
      aria-label={ariaLabel.replace("{time}", clock).replace("{source}", label)}
      className="flex items-center gap-2 rounded-full bg-brand-tint px-3 py-1.5 text-[13px] font-semibold text-brand no-underline hover:text-brand"
    >
      <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden="true" />
      <span className="font-mono tabular-nums">{clock}</span>
      <span className="max-w-[120px] truncate">{label}</span>
    </Link>
  );
}
