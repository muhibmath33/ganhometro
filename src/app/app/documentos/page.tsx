import Link from "next/link";
import { Suspense } from "react";
import { CopyMessage } from "@/components/app/CopyMessage";
import { fieldInput, fieldLabel } from "@/components/app/SourceFields";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { fill } from "@/i18n/config";
import { taxProfile } from "@/lib/app/money";
import { loadTimerSources } from "@/lib/app/projects";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { addDays, dayKey } from "@/lib/app/time";
import { formatMoney } from "@/lib/calc";
import { isMonthKey, loadIncome } from "@/lib/documents/load";
import { accountantMessages } from "@/lib/documents/messages";
import { monthKeys } from "@/lib/money/reports";

const button = "min-h-12 cursor-pointer rounded-[10px] border-0 bg-brand px-5 font-sans text-[15px] font-bold text-white";
const secondary = "min-h-12 cursor-pointer rounded-[10px] border border-line bg-white px-4 font-sans text-[15px] font-semibold text-ink no-underline";
const grid = "grid grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-4";

async function Documents({ searchParams }: { searchParams: PageProps<"/app/documentos">["searchParams"] }) {
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const d = t.documents;
  const params = await searchParams;
  const today = dayKey(new Date(requestNow()), profile.timezone);
  const thisMonth = today.slice(0, 7);
  // The last six months by default (what landlords and banks usually ask for), up to this month.
  const sixAgo = (() => {
    const [y, m] = thisMonth.split("-").map(Number);
    return new Date(Date.UTC(y, m - 6, 1)).toISOString().slice(0, 7);
  })();
  const askedFrom = isMonthKey(params.de) ? params.de : sixAgo;
  const askedTo = isMonthKey(params.ate) ? params.ate : thisMonth;
  const valid = askedFrom <= askedTo && monthKeys(askedFrom, askedTo).length <= 24;
  const from = valid ? askedFrom : sixAgo;
  const to = valid ? askedTo : thisMonth;
  const docLang = locale === "en" ? "en" : "pt";

  const [{ report }, { active: sources }] = await Promise.all([
    loadIncome(supabase, profile, user.id, from, to, today),
    loadTimerSources(supabase, user.id),
  ]);
  const brl = (n: number) => formatMoney("R$", n, locale);
  const period = `de=${from}&ate=${to}`;
  const langSelect = (name: string, initial: "pt" | "en") => (
    <label className={fieldLabel}>
      {d.language}
      <select name={name} defaultValue={initial} className={fieldInput}>
        <option value="pt">{d.langs.pt}</option>
        <option value="en">{d.langs.en}</option>
      </select>
    </label>
  );
  const mode = taxProfile(profile).tax_mode;
  const checklist: { text: string; fromApp?: boolean }[] = [
    { text: d.decore.items.report, fromApp: true },
    { text: d.decore.items.sheet, fromApp: true },
    { text: d.decore.items.id },
    { text: d.decore.items.address },
    { text: d.decore.items.statements },
    { text: d.decore.items.contracts },
    { text: mode === "cnpj" ? d.decore.items.proLabore : d.decore.items.darf },
    { text: d.decore.items.irpf },
  ];

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{d.title}</h1>
        <p className="m-0 max-w-[640px] text-[15px] text-ink-soft">{d.lead}</p>
      </div>

      {!profile.doc_name && (
        <p role="note" className="m-0 flex flex-wrap items-baseline justify-between gap-2 rounded-[12px] bg-amber-tint px-4 py-3 text-[14px] text-amber-ink">
          <span className="font-semibold">{d.noName}</span>
          <Link href="/app/ajustes#documentos" className="font-bold text-amber-ink">
            {d.fillDetails} →
          </Link>
        </p>
      )}

      <Card>
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-[17px] font-bold">{d.income.title}</h2>
          <p className="m-0 text-[14px] text-ink-soft">{d.income.lead}</p>
        </div>
        <form method="get" action="/app/documentos" className="flex flex-col gap-4">
          <div className={grid}>
            <label className={fieldLabel}>
              {d.from}
              <input type="month" name="de" required defaultValue={from} max={thisMonth} placeholder="2026-05" className={fieldInput} />
            </label>
            <label className={fieldLabel}>
              {d.to}
              <input type="month" name="ate" required defaultValue={to} max={thisMonth} placeholder="2026-10" className={fieldInput} />
            </label>
            {langSelect("lang", docLang)}
          </div>
          <p className="m-0 text-[14px] font-semibold text-ink" role="status">
            {report.payments.length ? fill(d.income.summary, { total: brl(report.total), average: brl(report.average) }) : d.income.empty}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" formAction="/app/arquivos/comprovante" className={button}>
              {d.income.download}
            </button>
            <button type="submit" className={secondary}>
              {d.income.preview}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-[17px] font-bold">{d.decore.title}</h2>
          <p className="m-0 text-[14px] text-ink-soft">{d.decore.lead}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/app/arquivos/comprovante?${period}&lang=pt`} className={`${secondary} inline-flex items-center`}>
            {d.income.title} (PDF)
          </a>
          <a href={`/app/arquivos/pagamentos?${period}&lang=pt`} className={`${secondary} inline-flex items-center`}>
            {d.decore.spreadsheet}
          </a>
        </div>
        <h3 className="m-0 text-[15px] font-bold">{d.decore.checklist}</h3>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[14px]">
          {checklist.map((item) => (
            <li key={item.text} className="flex items-baseline gap-2">
              <span aria-hidden="true" className={item.fromApp ? "text-brand" : "text-muted"}>
                {item.fromApp ? "✓" : "○"}
              </span>
              <span>
                {item.text}
                {item.fromApp && <span className="text-[12px] font-semibold text-brand"> · {d.decore.fromApp}</span>}
              </span>
            </li>
          ))}
        </ul>
        <h3 className="m-0 text-[15px] font-bold">{d.decore.message}</h3>
        <CopyMessage
          key={period}
          messages={accountantMessages({ fromKey: from, toKey: to, mode, name: profile.doc_name })}
          initial="pt"
          labels={{ langs: d.langs, copy: d.copy, copied: d.copied, language: d.language }}
          rows={12}
        />
      </Card>

      <Card>
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-[17px] font-bold">{d.timesheet.title}</h2>
          <p className="m-0 text-[14px] text-ink-soft">{d.timesheet.lead}</p>
        </div>
        {sources.length ? (
          <form method="get" action="/app/arquivos/horas" className="flex flex-col gap-4">
            <div className={grid}>
              <label className={fieldLabel}>
                {d.timesheet.source}
                <select name="fonte" className={fieldInput}>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              {sources.some((s) => s.projects.length) && (
                <label className={fieldLabel}>
                  {d.timesheet.project}
                  <select name="projeto" className={fieldInput}>
                    <option value="">{d.timesheet.allProjects}</option>
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
            </div>
            <div className={grid}>
              <label className={fieldLabel}>
                {d.from}
                <input type="date" name="de" required defaultValue={`${thisMonth}-01`} max={today} className={fieldInput} />
              </label>
              <label className={fieldLabel}>
                {d.to}
                <input type="date" name="ate" required defaultValue={today} max={addDays(today, 1)} className={fieldInput} />
              </label>
              <label className={fieldLabel}>
                {d.timesheet.what}
                <select name="tipo" defaultValue="pagas" className={fieldInput}>
                  <option value="pagas">{d.timesheet.whats.pagas}</option>
                  <option value="todas">{d.timesheet.whats.todas}</option>
                </select>
              </label>
              {langSelect("lang", "en")}
            </div>
            <button type="submit" className={`${button} self-start`}>
              {d.timesheet.download}
            </button>
          </form>
        ) : (
          <Link href="/app/fontes" className="text-[15px] font-semibold">
            {t.timer.addSource}
          </Link>
        )}
      </Card>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <Card>
          <h2 className="m-0 text-[17px] font-bold">{d.review.title}</h2>
          <p className="m-0 text-[14px] text-ink-soft">{d.review.lead}</p>
          <Link href="/app/documentos/revisao" className="text-[15px] font-semibold">
            {d.review.open} →
          </Link>
        </Card>
        <Card>
          <h2 className="m-0 text-[17px] font-bold">{d.invoices.title}</h2>
          <p className="m-0 text-[14px] text-ink-soft">{d.invoices.lead}</p>
          <Link href="/app/faturas" className="text-[15px] font-semibold">
            {d.invoices.open} →
          </Link>
        </Card>
      </div>
    </>
  );
}

export default function DocumentsPage({ searchParams }: PageProps<"/app/documentos">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Documents searchParams={searchParams} />
    </Suspense>
  );
}
