import Link from "next/link";
import { Suspense } from "react";
import { ProPage } from "@/components/app/ProGate";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { fill } from "@/i18n/config";
import { loadFeeAudit } from "@/lib/app/money";
import { isPro, profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { dayKey } from "@/lib/app/time";
import { formatMoney } from "@/lib/calc";

const PERIODS = ["3", "6", "12"] as const;
type Period = (typeof PERIODS)[number];

async function Costs({ searchParams }: { searchParams: PageProps<"/app/pagamentos/custos">["searchParams"] }) {
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  if (!isPro(profile)) return <ProPage t={t} feature="fees" title={t.fees.title} />;
  const f = t.fees;
  const params = await searchParams;
  const period: Period = PERIODS.includes(params.meses as Period) ? (params.meses as Period) : "12";
  const today = dayKey(new Date(requestNow()), profile.timezone);
  // This month and the ones before it.
  const [y, m] = today.split("-").map(Number);
  const fromDay = new Date(Date.UTC(y, m - Number(period), 1)).toISOString().slice(0, 10);
  const audit = await loadFeeAudit(supabase, user.id, fromDay, today);

  const brl = (n: number) => formatMoney("R$", n, locale);
  const pct = (n: number | null) => (n === null ? "—" : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(n));
  const methodName = (method: string) =>
    method === "unknown" ? f.unknown : (t.payment.methods[method as keyof typeof t.payment.methods] ?? method);
  const costText = (cost: number) => (cost < 0 ? `${brl(-cost)} ${f.favour}` : brl(cost));
  const counted = audit.providers.filter((p) => p.counted > 0);

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link href="/app/pagamentos" className="text-[14px] font-semibold">
          ← {t.payments.title}
        </Link>
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{f.title}</h1>
        <p className="m-0 max-w-[640px] text-[15px] text-ink-soft">{f.lead}</p>
      </div>

      <nav aria-label={f.title} className="flex gap-1 self-start rounded-[12px] border border-line bg-white p-1">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={p === "12" ? "/app/pagamentos/custos" : `/app/pagamentos/custos?meses=${p}`}
            aria-current={p === period ? "page" : undefined}
            className={`rounded-[9px] px-3 py-2 text-[14px] font-semibold no-underline ${
              p === period ? "bg-ink text-white hover:text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {f.periods[p]}
          </Link>
        ))}
      </nav>

      {counted.length === 0 ? (
        <Card>
          <p className="m-0 text-[15px] text-ink-soft">{f.empty}</p>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 text-[17px] font-bold">{f.total}</h2>
            <span className="font-mono text-[22px] font-semibold">
              {costText(audit.total.cost)} <span className="text-[15px] text-ink-soft">({pct(audit.total.pct)})</span>
            </span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {counted.map((p) => (
              <li key={p.method} className="flex flex-col gap-1 rounded-[12px] bg-paper px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[15px] font-bold">
                    {methodName(p.method)} <span className="text-[13px] font-normal text-muted">· {p.counted} {p.counted === 1 ? f.paymentOne : f.payments.toLowerCase()}</span>
                  </span>
                  <span className="font-mono text-[16px] font-semibold">
                    {costText(p.cost)} <span className="text-[13px] text-ink-soft">({pct(p.pct)})</span>
                  </span>
                </div>
                <span className="text-[13px] text-ink-soft">
                  <span className="whitespace-nowrap">
                    {f.expected} {brl(p.expected)}
                  </span>{" "}
                  ·{" "}
                  <span className="whitespace-nowrap">
                    {f.arrived} {brl(p.arrived)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {audit.savings && (
            <p className="m-0 rounded-[10px] bg-brand-tint px-3 py-2 text-[14px] font-semibold text-brand">
              {fill(f.savings, { best: methodName(audit.savings.best), pct: pct(audit.savings.bestPct), amount: brl(audit.savings.amount) })}
            </p>
          )}
        </Card>
      )}

      {audit.uncounted > 0 && (
        <p className="m-0 text-[14px] text-ink-soft">
          {fill(f.uncounted, { n: audit.uncounted })}{" "}
          <Link href="/app/pagamentos" className="font-semibold">
            {t.payments.title} →
          </Link>
        </p>
      )}
      <p className="m-0 max-w-[720px] text-[13px] text-muted">{f.how}</p>
    </>
  );
}

export default function CostsPage({ searchParams }: PageProps<"/app/pagamentos/custos">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Costs searchParams={searchParams} />
    </Suspense>
  );
}
