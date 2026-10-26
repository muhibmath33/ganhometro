"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n";

export function Faq({ items }: { items: Dictionary["faq"]["items"] }) {
  const [open, setOpen] = useState(0);

  return (
    <>
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="rounded-xl border border-line">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-${i}`}
              className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-[18px] text-left font-sans text-[16px] font-bold text-ink"
            >
              <span>{f.q}</span>
              <span aria-hidden="true" className="text-[22px] font-medium text-muted">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <p id={`faq-${i}`} className="m-0 px-[18px] pb-[18px] text-[15px] leading-[1.6] text-ink-soft">
                {f.a}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}
