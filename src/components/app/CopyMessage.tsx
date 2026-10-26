"use client";

import { useState } from "react";
import type { DocLang } from "@/i18n/documents";

// A ready-made message in Portuguese or English, with a copy button. The text stays editable in place, so
// the person can adjust it before copying.
export function CopyMessage({
  messages,
  initial,
  labels,
  rows = 10,
}: {
  messages: Record<DocLang, string>;
  initial: DocLang;
  labels: { langs: Record<DocLang, string>; copy: string; copied: string; language: string };
  rows?: number;
}) {
  const [lang, setLang] = useState<DocLang>(initial);
  const [texts, setTexts] = useState(messages);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(texts[lang]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (old browser or no permission): the text is selectable in the box.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label={labels.language} className="flex gap-1 self-start rounded-[10px] border border-line bg-white p-1">
        {(["en", "pt"] as const).map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={lang === l}
            onClick={() => setLang(l)}
            className={`cursor-pointer rounded-[8px] border-0 px-3 py-1.5 font-sans text-[13px] font-semibold ${
              lang === l ? "bg-ink text-white" : "bg-transparent text-ink-soft"
            }`}
          >
            {labels.langs[l]}
          </button>
        ))}
      </div>
      <textarea
        aria-label={labels.copy}
        value={texts[lang]}
        onChange={(e) => setTexts({ ...texts, [lang]: e.target.value })}
        rows={rows}
        className="w-full rounded-[10px] border border-field bg-white px-3.5 py-3 font-sans text-[14px] leading-relaxed text-ink"
      />
      <button
        type="button"
        onClick={copy}
        className="min-h-11 cursor-pointer self-start rounded-[10px] border border-brand bg-white px-4 font-sans text-[14px] font-bold text-brand"
      >
        {copied ? labels.copied : labels.copy}
      </button>
      <span role="status" className="sr-only">
        {copied ? labels.copied : ""}
      </span>
    </div>
  );
}
