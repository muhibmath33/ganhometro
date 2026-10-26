// Time-zone helpers for the app: the user's "today", days in the time log, and the times they type.
// No imports, so `npm test` runs them directly with Node.

const pad = (n: number) => String(n).padStart(2, "0");

const formatters = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

// The wall clock in a time zone at an instant.
export function zonedParts(date: Date, timeZone: string) {
  const p: Record<string, number> = {};
  for (const part of partsFormatter(timeZone).formatToParts(date)) p[part.type] = Number(part.value);
  return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, second: p.second };
}

// "2026-10-27": the calendar day of an instant in a time zone.
export function dayKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

// "14:05": the wall-clock time of an instant in a time zone (the value an <input type="time"> uses).
export function timeKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

// How far a time zone's clock is ahead of UTC at an instant, in ms (São Paulo: −3 h).
function offsetMs(instant: number, timeZone: string): number {
  const p = zonedParts(new Date(instant), timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(instant / 1000) * 1000;
}

// The instant when the clock in a time zone shows this day ("2026-10-27") and time ("14:05").
// Returns null for anything that isn't a real date and time.
export function zonedToUtc(day: string, time: string, timeZone: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const [year, month, date, hour, minute] = [+d[1], +d[2], +d[3], +t[1], +t[2]];
  if (hour > 23 || minute > 59) return null;
  const wall = Date.UTC(year, month - 1, date, hour, minute);
  if (new Date(wall).getUTCDate() !== date || new Date(wall).getUTCMonth() !== month - 1) return null;
  // Near a daylight-saving change the offset at the answer can differ from the first guess; a second pass settles it.
  const first = wall - offsetMs(wall, timeZone);
  return new Date(wall - offsetMs(first, timeZone));
}

// Midnight at the start of a day in a time zone.
export function startOfDay(day: string, timeZone: string): Date {
  return zonedToUtc(day, "00:00", timeZone) ?? new Date(NaN);
}

// "2026-10-27" + 5 → "2026-11-01"
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// 9_000_000 ms → "2h30" (pt-BR) or "2h 30m" (en). Rounded to the minute.
export function formatDuration(ms: number, locale: string): string {
  const total = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (locale === "en") return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  return h ? (m ? `${h}h${pad(m)}` : `${h}h`) : `${m} min`;
}

// 5_025_000 ms → "01:23:45", for the running timer.
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}
