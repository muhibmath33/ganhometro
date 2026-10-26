"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { FreelancerExtras } from "@/i18n/freelancers";
import { track } from "@/lib/analytics";
import { CheckIcon } from "./icons";

// "What do you want first?": features that aren't built yet. Each tap is a Umami event, so we
// learn what to build next before building it (docs/freelancer-market.md §6).
export function FeatureVotes({ t, locale }: { t: FreelancerExtras["votes"]; locale: Locale }) {
  const [voted, setVoted] = useState<string[]>([]);
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
      {t.items.map((item) => {
        const done = voted.includes(item.key);
        return (
          <div key={item.key} className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-white p-5">
            <h3 className="m-0 text-[17px] font-bold">{item.title}</h3>
            <p className="m-0 text-[15px] leading-[1.55] text-ink-soft">{item.text}</p>
            <div className="mt-auto pt-1">
              {done ? (
                <p role="status" className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-bold text-brand">
                  <CheckIcon size={18} strokeWidth={2.4} />
                  {t.done}{" "}
                  <a href="#lista" className="font-semibold">
                    {t.join}
                  </a>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setVoted((v) => [...v, item.key]);
                    track("Feature vote", { feature: item.key, locale });
                  }}
                  className="min-h-11 cursor-pointer rounded-[10px] border border-brand bg-white px-4 font-sans text-[15px] font-bold text-brand"
                >
                  {t.button}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
