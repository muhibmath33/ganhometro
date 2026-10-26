import type { Locale } from "./config";
import en from "./en";
import { type DeepPartial, enFreelancers, ptFreelancers } from "./freelancers";
import pt, { type Dictionary } from "./pt";

export type { Dictionary };
export * from "./config";

// Which landing page the text is for: the main (AI trainer) page or /freelancers.
export type Audience = "ai" | "freelancers";

function merge<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (!override) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] =
      value && typeof value === "object" && !Array.isArray(value) && current && typeof current === "object"
        ? merge(current, value as DeepPartial<typeof current>)
        : value;
  }
  return out as T;
}

export function getDictionary(locale: Locale, audience: Audience = "ai"): Dictionary {
  const base = locale === "en" ? en : pt;
  if (audience === "ai") return base;
  return merge(base, locale === "en" ? enFreelancers : ptFreelancers);
}
