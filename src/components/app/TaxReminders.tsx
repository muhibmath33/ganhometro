import Link from "next/link";
import type { AppDictionary } from "@/i18n/app";
import { fill, type Locale } from "@/i18n/config";
import type { TaxMonthRow } from "@/lib/app/taxes";
import { brl, formatDay } from "../calculators/shared";

const monthName = (key: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(`${key}-15T12:00:00Z`));

// DARF (or DAS) late or due within a week, and the R$ 5 mil warning for the current month.
export function TaxReminders({
  t,
  locale,
  mode,
  reminders,
  current,
}: {
  t: AppDictionary;
  locale: Locale;
  mode: "pf" | "cnpj";
  reminders: TaxMonthRow[];
  current?: TaxMonthRow;
}) {
  const r = t.taxes.reminders;
  const limit =
    mode === "pf" && current && current.gross > 4000
      ? fill(current.gross > 5000 ? t.taxes.limit.over : t.taxes.limit.near, {
          month: monthName(current.key, locale),
          gross: brl(current.gross, locale),
          tax: brl(current.carneLeao.monthTax, locale),
        })
      : null;
  if (!reminders.length && !limit) return null;
  return (
    <div className="flex flex-col gap-2">
      {reminders.map((m) => (
        <p
          key={m.key}
          role="alert"
          className={`m-0 flex flex-wrap items-baseline justify-between gap-2 rounded-[12px] px-4 py-3 text-[14px] font-semibold ${
            m.status === "overdue" ? "bg-amber text-white" : "bg-amber-tint text-amber-ink"
          }`}
        >
          <span>
            {fill(r[m.status === "overdue" ? "overdue" : "soon"][mode], {
              month: monthName(m.key, locale),
              amount: brl(m.amountDue, locale),
              date: formatDay(m.due, locale),
            })}
          </span>
          <Link href={`/app/impostos/${m.key}`} className={m.status === "overdue" ? "text-white hover:text-white" : "text-amber-ink"}>
            {r.open} →
          </Link>
        </p>
      ))}
      {limit && <p className="m-0 rounded-[12px] bg-amber-tint px-4 py-3 text-[14px] font-semibold text-amber-ink">{limit}</p>}
    </div>
  );
}
