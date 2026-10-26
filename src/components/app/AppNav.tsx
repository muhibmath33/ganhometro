"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CardIcon, ChartIcon, ClockIcon, GuideIcon, ListIcon, SlidersIcon } from "../icons";

const ICONS = { today: ClockIcon, dashboard: ChartIcon, payments: CardIcon, taxes: GuideIcon, log: ListIcon, settings: SlidersIcon };

// also: other paths that belong to the item (platforms live under Settings, invoices under Payments).
// desktopOnly: left out of the phone tab bar, which has room for five (the time log is one tap away on Today).
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; also?: string[]; desktopOnly?: boolean };

// A tab bar at the bottom on phones, links in the header from 640px up.
export function AppNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] sm:static sm:flex sm:flex-wrap sm:gap-1 sm:border-0 sm:bg-transparent sm:pb-0"
    >
      {items.map((item) => {
        const active =
          item.href === "/app" ? pathname === "/app" : [item.href, ...(item.also ?? [])].some((path) => pathname.startsWith(path));
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`min-w-0 flex-col items-center gap-0.5 px-1 pt-2 pb-1.5 text-[11px] font-semibold no-underline sm:flex sm:rounded-[9px] sm:px-3 sm:py-2 sm:text-[14px] ${
              item.desktopOnly ? "hidden" : "flex"
            } ${
              active ? "text-brand hover:text-brand sm:bg-ink sm:text-white sm:hover:text-white" : "text-muted hover:text-ink sm:text-ink-soft"
            }`}
          >
            <Icon size={22} className="sm:hidden" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
