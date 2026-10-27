// Reads a Toggl Track or Clockify time export (CSV, detailed report) in the browser. Only each entry's start,
// end, client, project and billable flag are kept; task descriptions are never read (time and money only).
// Other CSVs with start and end columns work too, in English or Portuguese.
// Relative imports with extensions, so `npm test` runs it directly with Node.
import { detectDayFirst, parseCsv, parseDate } from "./statementImport.ts";

export type TimeFormat = "toggl" | "clockify" | "generic";
// Times are on the clock of the tool that exported them ("2026-10-05", "09:00"); the server converts them
// with the person's time zone.
export type TimeRow = {
  startDay: string;
  startTime: string;
  endDay: string;
  endTime: string;
  client: string;
  project: string;
  billable: boolean | null;
  minutes: number;
  ref: string;
};
export type TimeResult = { format: TimeFormat; rows: TimeRow[]; skipped: number; ambiguousDates: boolean };

const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const find = (headers: string[], patterns: RegExp[]) => {
  for (const p of patterns) {
    const i = headers.findIndex((x) => p.test(x));
    if (i >= 0) return i;
  }
  return -1;
};

// "09:00:00", "9:00", "09:00 AM", "9:00:00 pm", "21h05" → "09:00"
export function parseClock(raw: string): string | null {
  const m = /^(\d{1,2})[:h](\d{2})(?::\d{2})?\s*([ap]\.?m\.?)?$/i.exec(raw.trim());
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ampm = m[3]?.toLowerCase().replace(/\./g, "");
  if (ampm === "pm" && h < 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

const YES = new Set(["yes", "sim", "true", "1", "y", "s", "billable", "faturavel"]);
const NO = new Set(["no", "nao", "false", "0", "n", "non-billable", "nao faturavel"]);

// Short stable hash, so importing the same file twice is detected.
function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

const minutesBetween = (aDay: string, aTime: string, bDay: string, bTime: string) =>
  (Date.parse(`${bDay}T${bTime}:00Z`) - Date.parse(`${aDay}T${aTime}:00Z`)) / 60_000;

// dayFirst: the order for dates like 05/10/2026, when the file itself doesn't settle it (all days ≤ 12).
export function readTimesheet(text: string, { dayFirst }: { dayFirst: boolean }): TimeResult {
  const table = parseCsv(text);
  const empty = (format: TimeFormat): TimeResult => ({ format, rows: [], skipped: 0, ambiguousDates: false });
  if (table.length < 2) return empty("generic");
  const headers = table[0].map(norm);
  const format: TimeFormat = headers.some((h) => h.startsWith("duration (decimal)") || h.startsWith("duracao (decimal)"))
    ? "clockify"
    : headers.includes("duration") && headers.some((h) => h.startsWith("amount"))
      ? "toggl"
      : "generic";

  const col = {
    startDay: find(headers, [/^start date$/, /^data de inicio$/, /^data inicial$/, /^start$/, /^inicio$/]),
    startTime: find(headers, [/^start time$/, /^hora de inicio$/, /^hora inicial$/]),
    endDay: find(headers, [/^end date$/, /^data de termino$/, /^data de fim$/, /^data final$/, /^end$/, /^fim$/, /^termino$/]),
    endTime: find(headers, [/^end time$/, /^hora de termino$/, /^hora de fim$/, /^hora final$/]),
    client: find(headers, [/^client$/, /^cliente$/]),
    project: find(headers, [/^project$/, /^projeto$/]),
    billable: find(headers, [/^billable$/, /^faturavel$/]),
  };
  if (col.startDay < 0 || col.endDay < 0) return empty(format);

  const body = table.slice(1);
  const dates = body.flatMap((r) => [r[col.startDay] ?? "", r[col.endDay] ?? ""]);
  const settled = detectDayFirst(dates, true) === detectDayFirst(dates, false);
  const first = detectDayFirst(dates, dayFirst);

  const rows: TimeRow[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const r of body) {
    const cell = (i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
    // A start column may hold the date and the time together ("2026-10-05 09:00:00").
    const split = (dayIdx: number, timeIdx: number) => {
      const raw = cell(dayIdx);
      const day = parseDate(raw, first);
      const timeText = timeIdx >= 0 ? cell(timeIdx) : raw.replace(/^\S+\s+/, "");
      return { day, time: parseClock(timeText) };
    };
    const start = split(col.startDay, col.startTime);
    const end = split(col.endDay, col.endTime);
    if (!start.day || !start.time || !end.day || !end.time) {
      skipped++;
      continue;
    }
    const minutes = minutesBetween(start.day, start.time, end.day, end.time);
    // Zero-length entries and anything over a day are almost certainly mistakes in the source.
    if (!(minutes > 0) || minutes > 24 * 60) {
      skipped++;
      continue;
    }
    const billableText = norm(cell(col.billable));
    const client = cell(col.client);
    const project = cell(col.project);
    const ref = `${format}:${hash(`${start.day} ${start.time}|${end.day} ${end.time}|${client}|${project}`)}`;
    if (seen.has(ref)) {
      skipped++;
      continue;
    }
    seen.add(ref);
    rows.push({
      startDay: start.day,
      startTime: start.time,
      endDay: end.day,
      endTime: end.time,
      client,
      project,
      billable: YES.has(billableText) ? true : NO.has(billableText) ? false : null,
      minutes,
      ref,
    });
  }
  rows.sort((a, b) => `${a.startDay} ${a.startTime}`.localeCompare(`${b.startDay} ${b.startTime}`));
  return { format, rows, skipped, ambiguousDates: !settled && dates.some((d) => /^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}/.test(d.trim())) };
}

// The label entries are grouped by when choosing where they go: the client, else the project.
export const groupOf = (row: Pick<TimeRow, "client" | "project">) => row.client || row.project || "";
