import Link from "next/link";
import type { AppDictionary } from "@/i18n/app";
import { fill, type Locale } from "@/i18n/config";
import type { LateAlert } from "@/lib/app/alerts";
import { formatDay } from "../calculators/shared";

// Payments that look late: a payday passed (plus grace days) after paid work, with nothing logged.
export function LateAlerts({ t, locale, alerts }: { t: AppDictionary; locale: Locale; alerts: LateAlert[] }) {
  if (!alerts.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a) => (
        <div key={a.sourceId} role="alert" className="flex flex-col gap-1 rounded-[12px] bg-amber-tint px-4 py-3 text-[14px] text-amber-ink">
          <span className="font-semibold">{fill(t.late.line, { source: a.name, payday: formatDay(a.payday, locale) })}</span>
          <span className="flex flex-wrap items-baseline justify-between gap-2">
            <span>{t.late.hint}</span>
            <Link href="/app/pagamentos" className="font-bold text-amber-ink">
              {t.late.register} →
            </Link>
          </span>
        </div>
      ))}
    </div>
  );
}
