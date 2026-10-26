// Validation and display helpers for time entries (timer and time log).
import type { AppDictionary } from "@/i18n/app";
import type { Database } from "@/lib/supabase/database.types";
import { addDays, timeKey, zonedToUtc } from "./time";

export type Entry = Database["public"]["Tables"]["time_entries"]["Row"];
export type EntryKind = Database["public"]["Enums"]["entry_kind"];
export type EntryError = keyof AppDictionary["entry"]["errors"];
export type Category = Pick<Database["public"]["Tables"]["categories"]["Row"], "id" | "kind" | "name">;

export const ENTRY_KINDS = ["paid", "unpaid"] as const satisfies readonly EntryKind[];

// Timer entries shorter than this are dropped on stop (or changed in place on a switch),
// so a mis-tap doesn't leave a 3-second entry in the log.
export const MIN_TIMER_MS = 60_000;

// Up to a minute ahead is fine: phone and server clocks rarely agree to the second.
const CLOCK_SLACK_MS = 60_000;

const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

// "" → null (not given); otherwise a whole number of tasks, or undefined if invalid.
export function parseUnits(value: FormDataEntryValue | null): number | null | undefined {
  const t = text(value);
  if (t === "") return null;
  const n = Number(t);
  return Number.isInteger(n) && n >= 0 && n <= 100_000 ? n : undefined;
}

export const parseKind = (value: FormDataEntryValue | null): EntryKind => (value === "unpaid" ? "unpaid" : "paid");

// Reads a manual entry or an edit: a day plus start and end times on the user's clock.
// An end time earlier than the start means the work went past midnight.
// A running entry may leave the end empty, which keeps the timer going.
export function parseEntryForm(
  form: FormData,
  timeZone: string,
  now: Date,
  { running = false } = {},
):
  | { data: { source_id: string; kind: EntryKind; category_id: string | null; units: number | null; started_at: string; ended_at: string | null } }
  | { error: EntryError } {
  const sourceId = text(form.get("source_id"));
  if (!sourceId) return { error: "source" };

  const day = text(form.get("date"));
  const start = zonedToUtc(day, text(form.get("start")), timeZone);
  if (!start) return { error: "time" };

  let end: Date | null = null;
  const endText = text(form.get("end"));
  if (endText || !running) {
    end = zonedToUtc(day, endText, timeZone);
    if (!end) return { error: "time" };
    if (end <= start) end = zonedToUtc(addDays(day, 1), endText, timeZone);
    if (!end || end <= start) return { error: "time" };
  }
  if (start.getTime() > now.getTime() + CLOCK_SLACK_MS || (end && end.getTime() > now.getTime() + CLOCK_SLACK_MS))
    return { error: "future" };

  const units = parseUnits(form.get("units"));
  if (units === undefined) return { error: "units" };

  return {
    data: {
      source_id: sourceId,
      kind: parseKind(form.get("kind")),
      category_id: text(form.get("category_id")) || null,
      units,
      started_at: start.toISOString(),
      ended_at: end ? end.toISOString() : null,
    },
  };
}

// "09:00–11:30", or "13:00–agora" while running.
export function entryTimes(entry: Pick<Entry, "started_at" | "ended_at">, timeZone: string, t: AppDictionary): string {
  const start = timeKey(new Date(entry.started_at), timeZone);
  return `${start}–${entry.ended_at ? timeKey(new Date(entry.ended_at), timeZone) : t.log.now}`;
}
