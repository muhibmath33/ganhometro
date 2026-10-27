// Small shared pieces for app forms.
import type { AppDictionary } from "@/i18n/app";

export function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-12 cursor-pointer self-start rounded-[10px] border-0 bg-brand px-5 font-sans text-[16px] font-bold text-white disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

// `errors` maps the form's error codes to text (platform form errors by default).
export function FormMessage({
  t,
  state,
  okText,
  errors = t.source.errors,
}: {
  t: AppDictionary;
  state: { error?: string; ok?: boolean } | null;
  okText?: string;
  errors?: Record<string, string>;
}) {
  if (state?.error) {
    const text =
      state.error === "freeLimit" ? t.source.freeLimit : state.error === "pro" ? t.plans.needPro : (errors[state.error] ?? t.common.genericError);
    return (
      <p role="alert" className="m-0 text-[14px] font-semibold text-amber-ink">
        {text}
      </p>
    );
  }
  if (state?.ok && okText) {
    return (
      <p role="status" className="m-0 text-[14px] font-semibold text-brand">
        {okText}
      </p>
    );
  }
  return null;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 ${className}`}>{children}</section>;
}

// Paid vs. unpaid share, as on the landing page's example card. The numbers are always in the text beside it.
export function SplitBar({ paid, unpaid }: { paid: number; unpaid: number }) {
  const total = paid + unpaid;
  const paidPct = total > 0 ? (paid / total) * 100 : 0;
  return (
    <div aria-hidden="true" className="flex h-2.5 overflow-hidden rounded-full bg-line">
      <div className="bg-brand" style={{ width: `${paidPct}%` }} />
      <div className="bg-unpaid" style={{ width: `${total > 0 ? 100 - paidPct : 0}%` }} />
    </div>
  );
}

export function SplitLegend({ t }: { t: AppDictionary }) {
  return (
    <div className="flex flex-wrap gap-3.5 text-[13px] text-ink-soft">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] bg-brand" />
        {t.kinds.paid}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] bg-unpaid" />
        {t.kinds.unpaid}
      </span>
    </div>
  );
}

export function KindBadge({ t, kind }: { t: AppDictionary; kind: "paid" | "unpaid" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] uppercase ${
        kind === "paid" ? "bg-brand-tint text-brand" : "bg-amber-tint text-amber-ink"
      }`}
    >
      {t.kinds[kind]}
    </span>
  );
}

// A radio button shown as a chip. Paid choices use the brand green, unpaid ones amber.
export function Chip({
  name,
  value,
  checked,
  onChange,
  tone = "paid",
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  tone?: "paid" | "unpaid";
  children: React.ReactNode;
}) {
  const on = tone === "paid" ? "border-brand bg-brand-tint text-brand" : "border-amber bg-amber-tint text-amber-ink";
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border px-3.5 text-[15px] font-semibold ${
        checked ? on : "border-field bg-white text-ink"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className={tone === "paid" ? "accent-brand" : "accent-amber"}
      />
      {children}
    </label>
  );
}

export const legendClass = "mb-1.5 text-[14px] font-bold text-ink";

// Shown while a page loads. No text: the language isn't known until the session is read.
export function PageSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-5">
      <div className="h-8 w-48 rounded-[10px] bg-line" />
      <div className="h-40 rounded-2xl bg-white" />
      <div className="h-28 rounded-2xl bg-white" />
    </div>
  );
}
