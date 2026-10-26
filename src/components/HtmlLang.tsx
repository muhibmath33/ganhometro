"use client";

import { useEffect } from "react";

// The root layout renders <html lang="pt-BR">. English pages also wrap their content in
// lang="en"; this keeps <html lang> in sync once the page is running in the browser.
export function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [lang]);
  return null;
}
