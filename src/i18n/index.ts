import type { Locale } from "./config";
import en from "./en";
import pt, { type Dictionary } from "./pt";

export type { Dictionary };
export * from "./config";

export function getDictionary(locale: Locale): Dictionary {
  return locale === "en" ? en : pt;
}
