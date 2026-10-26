import Link from "next/link";
import { Suspense } from "react";
import { ReservesCard } from "@/components/app/ReservesCard";
import { TakeHomeCard } from "@/components/app/TakeHomeCard";
import { Card, PageSkeleton, SplitBar, SplitLegend } from "@/components/app/ui";
import { categoryName, getAppDictionary } from "@/i18n/app";
import { fill } from "@/i18n/config";
import { reserveSettings, takeHomeHistory, taxProfile } from "@/lib/app/money";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { currencySymbol } from "@/lib/app/sources";
import { addDays, dayKey, formatDuration, startOfDay } from "@/lib/app/time";
import { formatMoney } from "@/lib/calc";
import { latestPtax } from "@/lib/money/ptax";
import { entryHours, projectRate, type RateProject, summarizeSource } from "@/lib/money/realRate";
import { checkUnderpayment, periodShare, receivedSummary } from "@/lib/money/received";
import { reserveHistory, suggestedSalary } from "@/lib/money/reserves";

const PERIODS = ["7", "28", "month"] as const;
type Period = (typeof PERIODS)[number];
const HOUR = 3_600_000;

async function Dashboard({ searchParams }: { searchParams: PageProps<"/app/painel">["searchParams"] }) {
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const d = t.dashboard;
  const tz = profile.timezone;
  const params = await searchParams;
  const period: Period = PERIODS.includes(params.periodo as Period) ? (params.periodo as Period) : "28";

  const now = requestNow();
  const today = dayKey(new Date(now), tz);
  const fromDay = period === "month" ? `${today.slice(0, 8)}01` : addDays(today, -(Number(period) - 1));
  const from = startOfDay(fromDay, tz).getTime();

  // Payments whose work period touches this period, and the take-home of every month since the first
  // payment (up to 24): this month's for the card, all of them for the reserves.
  const currentKey = today.slice(0, 7);
  const oldestKey = new Date(Date.UTC(Number(currentKey.slice(0, 4)), Number(currentKey.slice(5, 7)) - 24, 1)).toISOString().slice(0, 7);
  const [{ data: paymentRows }, { data: firstPayment }] = await Promise.all([
    supabase
      .from("payments")
      .select("source_id, project_id, invoice_id, amount, received_on, period_start, period_end")
      .eq("user_id", user.id)
      .or(`period_end.gte.${fromDay},received_on.gte.${fromDay}`),
    supabase.from("payments").select("received_on").eq("user_id", user.id).order("received_on").limit(1),
  ]);
  const firstKey = firstPayment?.[0]?.received_on.slice(0, 7) ?? currentKey;
  const fromKey = firstKey < oldestKey ? oldestKey : firstKey > currentKey ? currentKey : firstKey;
  const history = await takeHomeHistory(supabase, profile, user.id, fromKey, currentKey);
  const month = history[history.length - 1];
  const settings = reserveSettings(profile);
  const monthsMoney = history.map((h) => ({ kept: h.takeHome.kept, tax: h.takeHome.tax, inss: h.takeHome.inss }));
  const reserves = reserveHistory(monthsMoney, settings, Number(fromKey.slice(5, 7)));
  // Suggest a salary from complete months only.
  const suggestion = suggestedSalary(monthsMoney.slice(0, -1).map((m) => m.kept), settings);
  const payments = (paymentRows ?? []).map((p) => ({ ...p, amount: Number(p.amount) }));
  // Hours from the earliest payment period too, so "possível diferença" sees all the work a payment covers.
  const entriesFrom = Math.min(from, ...payments.map((p) => startOfDay(p.period_start ?? p.received_on, tz).getTime()));

  const [{ data: sourceRows }, { data: projectRows }, { data: entryRows }, { data: categoryRows }] = await Promise.all([
    supabase.from("income_sources").select("id, name, pay_model, rate, currency, commission_pct, archived_at").order("created_at"),
    supabase.from("projects").select("id, source_id, name, pay_model, rate, fixed_price, archived_at").order("created_at"),
    supabase
      .from("time_entries")
      .select("source_id, project_id, kind, category_id, units, started_at, ended_at")
      .or(`ended_at.gte.${new Date(entriesFrom).toISOString()},ended_at.is.null`),
    supabase.from("categories").select("id, name, preset"),
  ]);
  const allEntries = entryRows ?? [];
  // The period's own entries, for hours and unpaid time.
  const entries = allEntries.filter((e) => !e.ended_at || Date.parse(e.ended_at) >= from);
  // Active sources, plus archived ones that still have hours in the period.
  const sources = (sourceRows ?? []).filter((s) => !s.archived_at || entries.some((e) => e.source_id === s.id));
  // A fixed price is spread over every hour a project has taken, so those projects need all their hours
  // and everything received for them.
  const projectsAll = projectRows ?? [];
  const fixedIds = projectsAll.filter((p) => p.pay_model === "fixed").map((p) => p.id);
  const [{ data: fixedEntryRows }, { data: fixedPaymentRows }] = await Promise.all([
    supabase.from("time_entries").select("project_id, kind, units, started_at, ended_at").in("project_id", fixedIds),
    supabase.from("payments").select("project_id, amount").in("project_id", fixedIds),
  ]);
  const fixedEntries = fixedEntryRows ?? [];
  const rateProjects = new Map<string, RateProject>(
    projectsAll.map((p) => [
      p.id,
      {
        id: p.id,
        pay_model: p.pay_model === "hourly" || p.pay_model === "fixed" ? p.pay_model : null,
        rate: p.rate === null ? null : Number(p.rate),
        fixed_price: p.fixed_price === null ? null : Number(p.fixed_price),
        lifetimeHours: fixedEntries.filter((e) => e.project_id === p.id).reduce((sum, e) => sum + entryHours(e, now), 0),
      },
    ]),
  );
  const receivedFor = (projectId: string) =>
    (fixedPaymentRows ?? []).filter((p) => p.project_id === projectId).reduce((sum, p) => sum + Number(p.amount), 0);
  const currencies = [...new Set(sources.map((s) => s.currency))];
  const ptax = new Map(await Promise.all(currencies.map(async (c) => [c, await latestPtax(c)] as const)));

  const cards = sources.map((s) => {
    const rate = s.rate === null ? null : Number(s.rate);
    const rateSource = { pay_model: s.pay_model, rate, commission_pct: s.commission_pct === null ? null : Number(s.commission_pct) };
    const mine = entries.filter((e) => e.source_id === s.id);
    const sourceProjects = projectsAll.filter((p) => p.source_id === s.id).map((p) => rateProjects.get(p.id)!);
    const summary = summarizeSource(rateSource, sourceProjects, mine, now, from);
    // With payments in the period, the real rate comes from the money received; otherwise it's an estimate.
    const sourcePayments = payments.filter((p) => p.source_id === s.id);
    const summaryFromPayments = sourcePayments.some((p) => periodShare(p, fromDay, today) > 0)
      ? receivedSummary(rateSource, mine, sourcePayments, { fromDay, toDay: today, timeZone: tz, now })
      : null;
    // A payment whose days have no logged hours can't give a rate; the estimate is more useful then.
    const received = summaryFromPayments && summaryFromPayments.coveredHours > 0 ? summaryFromPayments : null;
    const underpaid = sourcePayments.filter(
      (p) =>
        checkUnderpayment(rateSource, p, allEntries.filter((e) => e.source_id === s.id), { timeZone: tz, now, projects: sourceProjects })
          ?.flagged,
    ).length;
    // Each project with hours in the period, with its own real rate.
    const projects = projectsAll
      .filter((p) => p.source_id === s.id)
      .map((p) => {
        const periodEntries = mine.filter((e) => e.project_id === p.id);
        const periodHours = periodEntries.reduce((sum, e) => sum + entryHours(e, now, from), 0);
        const rp = rateProjects.get(p.id)!;
        const received = rp.pay_model === "fixed" ? receivedFor(p.id) : 0;
        const r = projectRate(rateSource, rp, {
          periodEntries,
          allEntries: fixedEntries.filter((e) => e.project_id === p.id),
          received,
          now,
          from,
        });
        return { project: p, periodHours, received, ...r };
      })
      .filter((p) => p.periodHours > 0);
    const realRate = received ? received.realRate : summary.realRate;
    // Not against the advertised rate when projects with their own pay have hours in the period.
    const ownPay = projects.some((p) => p.project.pay_model === "hourly" || p.project.pay_model === "fixed");
    const gap = !ownPay && s.pay_model === "hourly" && rate && realRate !== null ? 1 - realRate / rate : null;
    const fx = ptax.get(s.currency) ?? null;
    return { source: s, rate, summary, received, underpaid, realRate, gap, fx, projects };
  });

  // Time without a client: always unpaid, part of the totals and of the overall real rate.
  const noClientHours = entries.filter((e) => !e.source_id).reduce((sum, e) => sum + entryHours(e, now, from), 0);
  const hours = cards.reduce((sum, c) => sum + c.summary.hours, 0) + noClientHours;
  const unpaidHours = cards.reduce((sum, c) => sum + c.summary.unpaidHours, 0) + noClientHours;
  // Overall, in reais: only sources whose earnings and exchange rate are both known.
  let earnedBrl = 0;
  let earnedHours = 0;
  for (const c of cards) {
    if (!c.fx) continue;
    if (c.received) {
      // Money received for the hours it covers, plus an estimate for hours not paid yet.
      earnedBrl += (c.received.earned + c.received.uncoveredHours * (c.summary.realRate ?? 0)) * c.fx.rate;
      earnedHours += c.received.coveredHours + (c.summary.realRate !== null ? c.received.uncoveredHours : 0);
    } else if (c.summary.earned !== null) {
      earnedBrl += c.summary.earned * c.fx.rate;
      earnedHours += c.summary.hours;
    }
  }
  if (earnedHours > 0) earnedHours += noClientHours;

  const unpaidByCategory = new Map<string, number>();
  for (const e of entries) {
    if (e.kind !== "unpaid") continue;
    const key = e.category_id ?? "";
    unpaidByCategory.set(key, (unpaidByCategory.get(key) ?? 0) + entryHours(e, now, from));
  }
  const categoryNames = new Map((categoryRows ?? []).map((c) => [c.id, categoryName(c, locale)]));
  const unpaidRows = [...unpaidByCategory].filter(([, h]) => h > 0).sort((a, b) => b[1] - a[1]);
  const maxUnpaid = unpaidRows[0]?.[1] ?? 0;

  const brl = (n: number) => formatMoney("R$", n, locale);
  const money = (currency: string, n: number) => formatMoney(currencySymbol(currency), n, locale);
  const dur = (h: number) => formatDuration(h * HOUR, locale);
  const pct = (share: number) => Math.round(share * 100);
  const fxDate = [...ptax.values()].find((p) => p && p.date)?.date;
  const fxMissing = [...ptax.entries()].some(([c, p]) => c !== "BRL" && !p);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(`${currentKey}-15T12:00:00Z`));

  const tile = (label: string, value: string, sub?: string) => (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-4">
      <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      <span className="font-mono text-[18px] leading-tight font-semibold sm:text-[22px]">{value}</span>
      {sub && <span className="text-[12px] text-muted">{sub}</span>}
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{d.title}</h1>
        <p className="m-0 max-w-[640px] text-[15px] text-ink-soft">{d.lead}</p>
      </div>

      <nav aria-label={d.title} className="flex gap-1 self-start rounded-[12px] border border-line bg-white p-1">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={p === "28" ? "/app/painel" : `/app/painel?periodo=${p}`}
            aria-current={p === period ? "page" : undefined}
            className={`rounded-[9px] px-3 py-2 text-[14px] font-semibold no-underline ${
              p === period ? "bg-ink text-white hover:text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {d.periods[p]}
          </Link>
        ))}
      </nav>

      <TakeHomeCard t={t} locale={locale} month={monthLabel} takeHome={month.takeHome} count={month.count} mode={taxProfile(profile).tax_mode} />
      {month.count > 0 && (
        <ReservesCard
          t={t}
          locale={locale}
          month={monthLabel}
          plan={reserves.plans[reserves.plans.length - 1]}
          history={reserves}
          salarySet={settings.salary !== null}
          suggestion={suggestion}
          emergencyTarget={(settings.salary ?? 0) * settings.emergencyMonths}
        />
      )}

      {hours === 0 ? (
        <Card>
          <p className="m-0 text-[15px] text-ink-soft">{d.empty}</p>
          <Link href="/app" className="text-[15px] font-semibold">
            {t.nav.today}
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {tile(d.worked, dur(hours))}
            {tile(d.unpaid, `${pct(unpaidHours / hours)}%`, dur(unpaidHours))}
            {tile(d.realRate, earnedHours > 0 ? `${brl(earnedBrl / earnedHours)}/h` : "—")}
            {tile(d.earned, earnedHours > 0 ? brl(earnedBrl) : "—")}
          </div>

          <div className="grid items-start gap-4 md:grid-cols-2">
            {cards.map(({ source: s, rate, summary, received, underpaid, realRate, gap, fx, projects }) => {
              const unit = s.pay_model === "per_task" ? t.sources.perTask : s.pay_model === "retainer" ? t.sources.perMonth : t.sources.perHour;
              const advertised =
                s.pay_model === "fixed" || rate === null ? t.sources.fixed : fill(d.advertises, { rate: money(s.currency, rate) + unit });
              const details: string[] = [];
              if (realRate !== null && s.currency !== "BRL") details.push(`${money(s.currency, realRate)}/h`);
              if (gap !== null) {
                const n = Math.round(gap * 100);
                details.push(n > 0 ? fill(d.gapLess, { n }) : n < 0 ? fill(d.gapMore, { n: -n }) : d.gapSame);
              } else if (!received && summary.paidRate !== null) {
                details.push(fill(d.perPaidHour, { rate: `${money(s.currency, summary.paidRate)}/h` }));
              }
              if (summary.unpaidShare !== null) details.push(fill(d.unpaidOf, { n: pct(summary.unpaidShare) }));
              const headline = realRate === null ? "—" : fx ? `${brl(realRate * fx.rate)}/h` : `${money(s.currency, realRate)}/h`;

              return (
                <Card key={s.id} className="gap-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="m-0 text-[17px] font-bold">
                      {s.name} {s.archived_at && <span className="text-[12px] font-semibold text-muted">· {d.archived}</span>}
                    </h2>
                    <span className="text-[13px] text-muted">{advertised}</span>
                  </div>
                  {summary.hours === 0 ? (
                    <p className="m-0 text-[14px] text-muted">{d.noHours}</p>
                  ) : (
                    <>
                      <SplitBar paid={summary.paidHours} unpaid={summary.unpaidHours} />
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[13px] text-ink-soft">
                          {fill(d.detail, { paid: dur(summary.paidHours), unpaid: dur(summary.unpaidHours) })}
                        </span>
                        <span className="font-mono text-[22px] font-semibold">{headline}</span>
                      </div>
                      {details.length > 0 && <p className="m-0 text-[13px] text-ink-soft">{details.join(" · ")}</p>}
                      {received ? (
                        <p className="m-0 text-[13px] text-ink-soft">
                          {fill(d.fromPayments, { earned: money(s.currency, received.earned), hours: dur(received.coveredHours) })}
                          {received.uncoveredHours > 0.01 && (
                            <>
                              <br />
                              {fill(d.toReceive, {
                                hours: dur(received.uncoveredHours),
                                amount: money(s.currency, received.uncoveredHours * (summary.realRate ?? 0)),
                              })}
                            </>
                          )}
                        </p>
                      ) : (
                        summary.realRate !== null && <p className="m-0 text-[12px] text-muted">{d.estimatedRate}</p>
                      )}
                      {underpaid > 0 && (
                        <p className="m-0 rounded-[10px] bg-amber-tint px-3 py-2 text-[13px] font-semibold text-amber-ink">
                          {underpaid === 1 ? d.underpaidOne : fill(d.underpaidMany, { n: underpaid })}{" "}
                          <Link href="/app/pagamentos" className="text-amber-ink">
                            {d.seePayments}
                          </Link>
                        </p>
                      )}
                      {!received && summary.missing && (
                        <p className="m-0 text-[13px] font-semibold text-amber-ink">
                          {summary.missing === "units" ? d.missingUnits : d.missingFixed}
                        </p>
                      )}
                      {projects.length > 0 && (
                        <div className="flex flex-col gap-1.5 border-t border-line pt-3">
                          <h3 className="m-0 text-[13px] font-bold text-ink-soft">{d.projects}</h3>
                          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px]">
                            {projects.map((p) => {
                              const rateText = p.realRate !== null ? money(s.currency, p.realRate) : null;
                              const text =
                                rateText === null
                                  ? fill(d.projectHours, { hours: dur(p.periodHours) })
                                  : p.basis === "rate"
                                    ? fill(d.projectRate, { rate: rateText, hours: dur(p.hours) })
                                    : fill(p.basis === "received" ? d.projectReceived : d.projectFixed, {
                                        money: money(s.currency, p.basis === "received" ? p.received : Number(p.project.fixed_price ?? 0)),
                                        rate: rateText,
                                        hours: dur(p.hours),
                                      });
                              return (
                                <li key={p.project.id} className="flex flex-wrap justify-between gap-x-3">
                                  <span className="font-semibold">{p.project.name}</span>
                                  <span className="text-ink-soft">{text}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              );
            })}
            {noClientHours > 0 && (
              <Card className="gap-3">
                <h2 className="m-0 text-[17px] font-bold">{d.noClientTitle}</h2>
                <SplitBar paid={0} unpaid={noClientHours} />
                <p className="m-0 text-[13px] text-ink-soft">{fill(d.noClientText, { hours: dur(noClientHours) })}</p>
              </Card>
            )}
          </div>
          <SplitLegend t={t} />

          {unpaidRows.length > 0 && (
            <Card>
              <h2 className="m-0 text-[17px] font-bold">{d.unpaidWhere}</h2>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {unpaidRows.map(([id, h]) => (
                  <li key={id || "none"} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-[14px]">
                      <span className="font-semibold">{(id && categoryNames.get(id)) || t.entry.noCategory}</span>
                      <span className="text-ink-soft">
                        <span className="font-mono font-semibold text-ink">{dur(h)}</span> · {pct(h / unpaidHours)}%
                      </span>
                    </div>
                    <div aria-hidden="true" className="h-2 rounded-full bg-paper">
                      <div className="h-2 rounded-full bg-unpaid" style={{ width: `${(h / maxUnpaid) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex flex-col gap-1 text-[13px] text-muted">
            <p className="m-0">{d.estimateNote}</p>
            {fxMissing ? (
              <p className="m-0">{d.ptaxMissing}</p>
            ) : (
              fxDate && (
                <p className="m-0">
                  {fill(d.ptaxNote, {
                    date: new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(
                      new Date(fxDate),
                    ),
                  })}
                </p>
              )
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function DashboardPage({ searchParams }: PageProps<"/app/painel">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}
