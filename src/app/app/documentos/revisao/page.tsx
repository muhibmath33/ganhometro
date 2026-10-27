import Link from "next/link";
import { Suspense } from "react";
import { formatDay } from "@/components/calculators/shared";
import { CopyMessage } from "@/components/app/CopyMessage";
import { fieldInput, fieldLabel } from "@/components/app/SourceFields";
import { ProPage } from "@/components/app/ProGate";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { fill } from "@/i18n/config";
import { loadTimerSources } from "@/lib/app/projects";
import { isPro, profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { currencySymbol } from "@/lib/app/sources";
import { addDays, dayKey, formatDuration, isDay } from "@/lib/app/time";
import { formatMoney } from "@/lib/calc";
import { loadReview } from "@/lib/documents/load";
import { reviewMessages } from "@/lib/documents/messages";
import { periodShare } from "@/lib/money/received";

const grid = "grid grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-4";
const button = "min-h-12 cursor-pointer rounded-[10px] border-0 bg-brand px-5 font-sans text-[15px] font-bold text-white";
const secondary = "inline-flex min-h-11 items-center rounded-[10px] border border-line bg-white px-4 text-[14px] font-semibold text-ink no-underline";

async function Review({ searchParams }: { searchParams: PageProps<"/app/documentos/revisao">["searchParams"] }) {
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  if (!isPro(profile)) return <ProPage t={t} feature="documents" title={t.documents.review.title} />;
  const r = t.documents.review;
  const params = await searchParams;
  const tz = profile.timezone;
  const now = requestNow();
  const today = dayKey(new Date(now), tz);
  const { active: sources } = await loadTimerSources(supabase, user.id);

  // From a payment ("Pedir revisão" on the payments list): its source, project and work period.
  let sourceId = typeof params.fonte === "string" ? params.fonte : "";
  let projectId = typeof params.projeto === "string" ? params.projeto : "";
  let from = typeof params.de === "string" && isDay(params.de) ? params.de : "";
  let to = typeof params.ate === "string" && isDay(params.ate) ? params.ate : "";
  if (typeof params.pagamento === "string") {
    const { data: p } = await supabase
      .from("payments")
      .select("source_id, project_id, received_on, period_start, period_end")
      .eq("user_id", user.id)
      .eq("id", params.pagamento)
      .maybeSingle();
    if (p) {
      sourceId = p.source_id;
      projectId = p.project_id ?? "";
      from = p.period_start ?? p.received_on;
      to = p.period_end ?? p.received_on;
    }
  }
  const ready = Boolean(sourceId && from && to && to >= from && addDays(from, 366) >= to);
  const data = ready ? await loadReview(supabase, user.id, tz, { sourceId, projectId: projectId || null, fromDay: from, toDay: to }, locale === "en" ? "en" : "pt", now) : null;
  const money = (n: number) => (data ? formatMoney(currencySymbol(data.review.currency), n, locale) : "");
  const dur = (h: number) => formatDuration(h * 3_600_000, locale);
  const query = data ? `fonte=${sourceId}${projectId ? `&projeto=${projectId}` : ""}&de=${from}&ate=${to}&revisao=1` : "";
  const flagged = data !== null && data.review.difference !== null;

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link href="/app/documentos" className="text-[14px] font-semibold">
          ← {t.documents.title}
        </Link>
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{r.title}</h1>
        <p className="m-0 max-w-[640px] text-[15px] text-ink-soft">{r.pageLead}</p>
      </div>

      <Card>
        <form method="get" action="/app/documentos/revisao" className="flex flex-col gap-4">
          <div className={grid}>
            <label className={fieldLabel}>
              {t.documents.timesheet.source}
              <select name="fonte" defaultValue={sourceId} className={fieldInput}>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            {sources.some((s) => s.projects.length) && (
              <label className={fieldLabel}>
                {t.documents.timesheet.project}
                <select name="projeto" defaultValue={projectId} className={fieldInput}>
                  <option value="">{t.documents.timesheet.allProjects}</option>
                  {sources.flatMap((s) =>
                    s.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {s.name} · {p.name}
                      </option>
                    )),
                  )}
                </select>
              </label>
            )}
            <label className={fieldLabel}>
              {t.documents.from}
              <input type="date" name="de" required defaultValue={from || `${today.slice(0, 8)}01`} max={today} className={fieldInput} />
            </label>
            <label className={fieldLabel}>
              {t.documents.to}
              <input type="date" name="ate" required defaultValue={to || today} max={addDays(today, 1)} className={fieldInput} />
            </label>
          </div>
          <button type="submit" className={`${button} self-start`}>
            {r.calculate}
          </button>
        </form>
      </Card>

      {data && (
        <>
          <Card>
            <h2 className="m-0 text-[17px] font-bold">
              {data.source.name}
              {data.project && <span className="font-semibold text-ink-soft"> · {data.project.name}</span>}
              <span className="block text-[14px] font-normal text-ink-soft">
                {formatDay(from, locale)} – {formatDay(to, locale)}
              </span>
            </h2>
            {data.sheet.paidHours === 0 ? (
              <p className="m-0 text-[14px] text-muted">{r.noHours}</p>
            ) : (
              <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[15px]">
                <dt className="text-ink-soft">{r.paidHours}</dt>
                <dd className="m-0 text-right font-mono font-semibold">{dur(data.sheet.paidHours)}</dd>
                {data.review.rate !== null && (
                  <>
                    <dt className="text-ink-soft">{r.rate}</dt>
                    <dd className="m-0 text-right font-mono">{money(data.review.rate)}/h</dd>
                  </>
                )}
                {data.review.expected !== null && (
                  <>
                    <dt className="text-ink-soft">{r.expected}</dt>
                    <dd className="m-0 text-right font-mono">{money(data.review.expected)}</dd>
                  </>
                )}
                <dt className="text-ink-soft">{r.received}</dt>
                <dd className="m-0 text-right font-mono">{money(data.review.received)}</dd>
                {flagged && (
                  <>
                    <dt className="font-bold">{r.difference}</dt>
                    <dd className="m-0 text-right font-mono font-bold">{money(data.review.difference!)}</dd>
                  </>
                )}
              </dl>
            )}
            {data.sheet.paidHours > 0 &&
              (flagged ? (
                <p role="note" className="m-0 rounded-[10px] bg-amber-tint px-3 py-2 text-[14px] font-semibold text-amber-ink">
                  {r.check}
                </p>
              ) : data.review.expected === null ? (
                <p className="m-0 text-[14px] text-ink-soft">{r.noRate}</p>
              ) : (
                <p className="m-0 text-[14px] text-ink-soft">{r.covered}</p>
              ))}
            <div className="flex flex-col gap-1">
              <h3 className="m-0 text-[14px] font-bold">{r.payments}</h3>
              {data.payments.length ? (
                <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-[14px] text-ink-soft">
                  {data.payments.map((p) => (
                    <li key={p.id}>
                      {fill(r.share, {
                        amount: formatMoney(currencySymbol(p.currency), p.amount, locale),
                        date: formatDay(p.received_on, locale),
                        pct: `${Math.round(periodShare(p, from, to) * 100)}%`,
                      })}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-[14px] text-muted">{r.noPayments}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`/app/arquivos/horas?${query}&lang=en`} className={secondary}>
                {r.pdf} ({t.documents.langs.en})
              </a>
              <a href={`/app/arquivos/horas?${query}&lang=pt`} className={secondary}>
                {r.pdf} ({t.documents.langs.pt})
              </a>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-1">
              <h2 className="m-0 text-[17px] font-bold">{r.message}</h2>
              <p className="m-0 text-[14px] text-ink-soft">{r.messageHint}</p>
            </div>
            <CopyMessage
              key={query}
              messages={reviewMessages({
                fromDay: from,
                toDay: to,
                paidHours: data.sheet.paidHours,
                currency: data.review.currency,
                rate: data.review.rate,
                expected: flagged ? data.review.expected : null,
                received: data.review.received,
                difference: flagged ? data.review.difference : null,
                name: profile.doc_name,
              })}
              initial="en"
              labels={{ langs: t.documents.langs, copy: t.documents.copy, copied: t.documents.copied, language: t.documents.language }}
              rows={13}
            />
          </Card>
        </>
      )}
    </>
  );
}

export default function ReviewPage({ searchParams }: PageProps<"/app/documentos/revisao">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Review searchParams={searchParams} />
    </Suspense>
  );
}
