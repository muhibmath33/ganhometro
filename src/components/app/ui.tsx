// Small shared pieces for app forms.
import type { FormState } from "@/app/app/actions";
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

export function FormMessage({ t, state, okText }: { t: AppDictionary; state: FormState; okText?: string }) {
  if (state?.error) {
    const text =
      state.error === "freeLimit" ? t.source.freeLimit : state.error === "generic" ? t.common.genericError : t.source.errors[state.error];
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
