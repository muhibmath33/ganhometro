"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="App" className="flex flex-wrap gap-1">
      {items.map((item) => {
        const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-[9px] px-3 py-2 text-[14px] font-semibold no-underline ${
              active ? "bg-ink text-white hover:text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
