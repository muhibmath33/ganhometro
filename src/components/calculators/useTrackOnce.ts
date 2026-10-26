import { useRef } from "react";
import type { Locale } from "@/i18n/config";
import { track } from "@/lib/analytics";

// "Calculator used" once per page view, on the first change.
export function useTrackOnce(calc: string, locale: Locale) {
  const done = useRef(false);
  return () => {
    if (done.current) return;
    done.current = true;
    track("Calculator used", { calc, locale });
  };
}
