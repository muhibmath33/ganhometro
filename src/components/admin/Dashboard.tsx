import { logout } from "@/app/admin/actions";
import { TIME_ZONE, type Row, type Stats } from "@/lib/admin/stats";

const SIGNUP_GOAL = 300; // handoff: 300–500 signups by week 8

const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE,
});
const fmtDay = (key: string) => dayLabel.format(new Date(`${key}T12:00:00Z`));
const fmtDateTime = (iso: string) => (iso ? dateTime.format(new Date(iso)) : "—");
const pct = (share: number) => `${Math.round(share * 100)}%`;

// Smallest round number at or above the value whose half is also a whole number
// (2, 4, 6, 8, 10, 12, 16, 20, 30, 40, 50, 60, 80, 100, 120, …), so both gridlines read cleanly.
function niceMax(value: number) {
  if (value <= 2) return 2;
  const tops: number[] = [];
  for (let k = 0; k <= 7; k++) {
    for (const m of [1, 1.2, 1.6, 2, 3, 4, 5, 6, 8]) {
      const n = Math.round(m * 10 ** k * 100) / 100;
      if (Number.isInteger(n) && n % 2 === 0) tops.push(n);
    }
  }
  return tops.sort((a, b) => a - b).find((n) => n >= value) ?? value;
}

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="min-h-10 cursor-pointer rounded-[9px] border border-line bg-white px-3.5 font-sans text-[14px] font-semibold text-ink"
      >
        Log out
      </button>
    </form>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-5">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      <span className="font-mono text-[30px] font-semibold text-ink">{value}</span>
      {note && <span className="text-[13px] text-muted">{note}</span>}
    </div>
  );
}

function DailyChart({ perDay }: { perDay: Stats["perDay"] }) {
  const top = niceMax(Math.max(...perDay.map((d) => d.count)));
  const peak = perDay.reduce((a, b) => (b.count > a.count ? b : a), perDay[0]);
  const ticks = [0, Math.floor(perDay.length / 2), perDay.length - 1];

  return (
    <figure className="m-0 flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <figcaption className="flex flex-col gap-0.5">
        <span className="text-[16px] font-bold">Signups per day</span>
        <span className="text-[13px] text-muted">Last {perDay.length} days, São Paulo time. Hover a bar for the exact number.</span>
      </figcaption>
      <div className="flex gap-2">
        <div className="flex h-44 flex-col justify-between pt-6 text-right font-mono text-[11px] text-muted" aria-hidden="true">
          <span>{top}</span>
          <span>{top / 2}</span>
          <span>0</span>
        </div>
        <div className="relative flex h-44 flex-1 items-end gap-[2px] border-b border-line pt-6">
          {/* Recessive gridlines at the top value and halfway. */}
          <div className="pointer-events-none absolute inset-x-0 top-6 border-t border-line" />
          <div className="pointer-events-none absolute inset-x-0 top-[calc(50%+12px)] border-t border-line" />
          {perDay.map((d) => {
            const height = (d.count / top) * 100;
            return (
              <div
                key={d.date}
                tabIndex={0}
                aria-label={`${fmtDay(d.date)}: ${d.count} signups`}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
              >
                <div
                  className="w-full max-w-6 rounded-t-[4px] bg-chart group-hover:opacity-80 group-focus:opacity-80"
                  style={{ height: `${height}%`, minHeight: d.count > 0 ? 2 : 0 }}
                />
                {d.date === peak.date && peak.count > 0 && (
                  <span
                    className="pointer-events-none absolute font-mono text-[11px] font-semibold text-ink"
                    style={{ bottom: `calc(${height}% + 3px)` }}
                  >
                    {d.count}
                  </span>
                )}
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[12px] font-semibold text-white group-hover:block group-focus:block"
                >
                  {fmtDay(d.date)} · {d.count} {d.count === 1 ? "signup" : "signups"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="relative ml-8 h-4 text-[12px] text-muted" aria-hidden="true">
        {ticks.map((i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
            style={{ left: `${((i + 0.5) / perDay.length) * 100}%` }}
          >
            {fmtDay(perDay[i].date)}
          </span>
        ))}
      </div>
      <details className="text-[13px]">
        <summary className="cursor-pointer font-semibold text-ink-soft">Show as table</summary>
        <table className="mt-2 w-full max-w-sm border-collapse">
          <tbody>
            {[...perDay].reverse().map((d) => (
              <tr key={d.date} className="border-b border-line">
                <td className="py-1">{fmtDay(d.date)}</td>
                <td className="py-1 text-right font-mono">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function Breakdown({ title, note, rows }: { title: string; note?: string; rows: Row[] }) {
  // Up to 7 rows; the rest fold into "Other".
  const shown = rows.length > 8 ? rows.slice(0, 7) : rows;
  const rest = rows.slice(shown.length);
  const display = rest.length
    ? [...shown, { label: "Other", count: rest.reduce((s, r) => s + r.count, 0), share: rest.reduce((s, r) => s + r.share, 0) }]
    : shown;
  const max = Math.max(1, ...display.map((r) => r.count));

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="m-0 text-[16px] font-bold">{title}</h2>
        {note && <span className="text-[13px] text-muted">{note}</span>}
      </div>
      {display.length === 0 ? (
        <p className="m-0 text-[14px] text-muted">No signups yet.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {display.map((r) => (
            <li key={r.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-[14px]">
              <span className="break-words text-ink">{r.label}</span>
              {/* The track is the full scale: the largest row fills it, the others are proportional. */}
              <span className="block h-3">
                <span
                  className="block h-full rounded-r-[4px] bg-chart"
                  style={{ width: `${(r.count / max) * 100}%`, minWidth: 2 }}
                />
              </span>
              <span className="whitespace-nowrap text-right font-mono text-[13px] text-ink">
                {r.count} <span className="text-muted">· {pct(r.share)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const formLabel = (form: string) => (form === "hero" ? "Top" : form === "final" ? "Bottom" : "—");

export function Dashboard({ stats }: { stats: Stats }) {
  const goal = Math.min(1, stats.active / SIGNUP_GOAL);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">Waitlist</h1>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/admin/export"
            className="flex min-h-10 items-center rounded-[9px] bg-ink px-3.5 text-[14px] font-bold text-white no-underline hover:text-white"
          >
            Download CSV
          </a>
          <LogoutButton />
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
        <Tile label="Signups" value={String(stats.active)} note={stats.unsubscribed ? `${stats.unsubscribed} unsubscribed (not counted)` : undefined} />
        <Tile label="Last 7 days" value={String(stats.last7)} />
        <Tile label="Today" value={String(stats.today)} />
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5">
          <span className="text-[13px] font-semibold text-muted">Goal: {SIGNUP_GOAL}–500 by week 8</span>
          <span className="font-mono text-[30px] font-semibold text-ink">{pct(goal)}</span>
          <span className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <span className="block h-full rounded-full bg-chart" style={{ width: pct(goal) }} />
          </span>
        </div>
      </div>

      <DailyChart perDay={stats.perDay} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-4">
        <Breakdown title="By channel" note="utm_source of the link people came from" rows={stats.bySource} />
        <Breakdown title="By campaign" note="utm_campaign" rows={stats.byCampaign} />
        <Breakdown title="By language" rows={stats.byLanguage} />
        <Breakdown title="By form" note="Top of the page or bottom" rows={stats.byForm} />
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
        <h2 className="m-0 text-[16px] font-bold">Latest signups</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-2 pr-3 font-semibold">Signed up</th>
                <th className="py-2 pr-3 font-semibold">Email</th>
                <th className="py-2 pr-3 font-semibold">Language</th>
                <th className="py-2 pr-3 font-semibold">Form</th>
                <th className="py-2 pr-3 font-semibold">Channel / campaign</th>
                <th className="py-2 font-semibold">Consent given</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((r) => (
                <tr key={r.email + r.createdAt} className="border-b border-line">
                  <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
                  <td className="py-2 pr-3">{r.email}</td>
                  <td className="py-2 pr-3">{r.language === "en" ? "EN" : "PT"}</td>
                  <td className="py-2 pr-3">{formLabel(r.form)}</td>
                  <td className="py-2 pr-3">{[r.source, r.campaign].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="py-2 whitespace-nowrap">{fmtDateTime(r.consentAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-[12px] text-muted">Showing the {stats.recent.length} most recent. Download the CSV for the full list.</p>
      </section>
    </div>
  );
}
