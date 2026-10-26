import type { AppDictionary } from "@/i18n/app";
import type { InvoiceState } from "@/lib/money/invoices";

const TONES: Record<InvoiceState, string> = {
  overdue: "bg-amber-tint text-amber-ink",
  paid: "bg-brand-tint text-brand",
  open: "bg-paper text-ink border border-line",
  partial: "bg-paper text-ink border border-line",
  draft: "bg-paper text-muted border border-line",
  void: "bg-paper text-muted border border-line",
};

// An invoice's state as a word, never color alone.
export function InvoiceBadge({ t, state }: { t: AppDictionary; state: InvoiceState }) {
  return <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${TONES[state]}`}>{t.invoices.states[state]}</span>;
}
