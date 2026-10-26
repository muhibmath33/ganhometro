// Waitlist numbers for the admin page. Days are counted in São Paulo time.
import type { Contact } from "./brevo";

export const TIME_ZONE = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }); // YYYY-MM-DD

export type Row = { label: string; count: number; share: number };
export type RecentRow = {
  email: string;
  createdAt: string;
  consentAt: string;
  language: string;
  form: string;
  source: string;
  campaign: string;
  work: string;
  landing: string;
};

export type Stats = {
  active: number;
  unsubscribed: number;
  today: number;
  last7: number;
  perDay: { date: string; count: number }[];
  bySource: Row[];
  byCampaign: Row[];
  byLanguage: Row[];
  byForm: Row[];
  byWork: Row[];
  byLanding: Row[];
  recent: RecentRow[];
};

const WORK_LABELS: Record<string, string> = {
  ai: "AI training",
  freelancer: "Freelancer (clients abroad)",
  teacher: "Online teaching",
  creator: "Content creation",
  other: "Other",
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function isUnsubscribed(c: Contact, listId: number) {
  return Boolean(c.emailBlacklisted) || (c.listUnsubscribed ?? []).includes(listId);
}

function breakdown(contacts: Contact[], pick: (c: Contact) => string): Row[] {
  const counts = new Map<string, number>();
  for (const c of contacts) counts.set(pick(c), (counts.get(pick(c)) ?? 0) + 1);
  const total = contacts.length || 1;
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, share: count / total }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function computeStats(all: Contact[], listId: number, now: Date, days = 30): Stats {
  const contacts = all.filter((c) => !isUnsubscribed(c, listId));
  const keyOf = (c: Contact) => dayKey.format(new Date(c.createdAt));

  const perDayKeys = Array.from({ length: days }, (_, i) => dayKey.format(new Date(now.getTime() - (days - 1 - i) * DAY_MS)));
  const counts = new Map(perDayKeys.map((k) => [k, 0]));
  for (const c of contacts) {
    const k = keyOf(c);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const perDay = perDayKeys.map((date) => ({ date, count: counts.get(date) ?? 0 }));
  const last7Keys = new Set(perDayKeys.slice(-7));

  return {
    active: contacts.length,
    unsubscribed: all.length - contacts.length,
    today: perDay[perDay.length - 1]?.count ?? 0,
    last7: contacts.filter((c) => last7Keys.has(keyOf(c))).length,
    perDay,
    bySource: breakdown(contacts, (c) => text(c.attributes?.UTM_SOURCE) || "(no campaign link)"),
    byCampaign: breakdown(contacts, (c) => text(c.attributes?.UTM_CAMPAIGN) || "(no campaign link)"),
    byLanguage: breakdown(contacts, (c) => (text(c.attributes?.LANGUAGE) === "en" ? "English" : "Portuguese")),
    byForm: breakdown(contacts, (c) => {
      const form = text(c.attributes?.SIGNUP_SOURCE);
      return form === "hero" ? "Top form" : form === "final" ? "Bottom form" : "Other";
    }),
    byWork: breakdown(contacts, (c) => WORK_LABELS[text(c.attributes?.WORK_TYPE)] ?? "(didn't answer)"),
    byLanding: breakdown(contacts, (c) => (text(c.attributes?.LANDING_PAGE) === "freelancers" ? "/freelancers" : "Main page (AI trainers)")),
    recent: [...contacts]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 25)
      .map((c) => ({
        email: c.email,
        createdAt: c.createdAt,
        consentAt: text(c.attributes?.CONSENT_AT),
        language: text(c.attributes?.LANGUAGE) || "pt-BR",
        form: text(c.attributes?.SIGNUP_SOURCE),
        source: text(c.attributes?.UTM_SOURCE),
        campaign: text(c.attributes?.UTM_CAMPAIGN),
        work: WORK_LABELS[text(c.attributes?.WORK_TYPE)] ?? "",
        landing: text(c.attributes?.LANDING_PAGE) === "freelancers" ? "Freelancers" : "Main",
      })),
  };
}
