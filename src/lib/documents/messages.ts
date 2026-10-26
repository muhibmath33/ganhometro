// The messages to copy: a payment reminder for an invoice, a payment review request for a platform, and the
// note to an accountant for a DECORE. Each is built in both document languages, so the page can offer either.
import { type DocLang, DOC_LANGS, getDocDictionary } from "@/i18n/documents";
import { fill } from "@/i18n/config";
import { docDate, docHours, docMoney, docMonth, docPeriod } from "./format";

const both = (build: (lang: DocLang) => string) => Object.fromEntries(DOC_LANGS.map((lang) => [lang, build(lang)])) as Record<DocLang, string>;
const signed = (lines: (string | null)[], name: string | null) => [...lines.filter((l) => l !== null), ...(name ? [name] : [])].join("\n");

export function reminderMessages(i: {
  number: string;
  client: string;
  currency: string;
  amount: number;
  paid: number;
  balance: number;
  issued: string;
  due: string;
  overdue: boolean;
  name: string | null;
}) {
  return both((lang) => {
    const m = getDocDictionary(lang).messages.reminder;
    const money = (n: number) => docMoney(i.currency, n, lang);
    return signed(
      [
        fill(m.subject, { number: i.number }),
        "",
        fill(m.hello, { client: i.client }),
        "",
        fill(m.body, {
          number: i.number,
          amount: money(i.amount),
          issued: docDate(i.issued, lang),
          due: fill(i.overdue ? m.dueLate : m.dueOpen, { date: docDate(i.due, lang) }),
        }),
        i.paid > 0 ? fill(m.partial, { paid: money(i.paid), balance: money(i.balance) }) : null,
        m.ask,
        "",
        m.bye,
      ],
      i.name,
    );
  });
}

export function reviewMessages(r: {
  fromDay: string;
  toDay: string;
  paidHours: number;
  currency: string;
  rate: number | null;
  expected: number | null;
  received: number;
  difference: number | null;
  name: string | null;
}) {
  return both((lang) => {
    const t = getDocDictionary(lang);
    const m = t.messages.dispute;
    const money = (n: number) => docMoney(r.currency, n, lang);
    const hours = docHours(r.paidHours, lang);
    const withMath = r.rate !== null && r.expected !== null && r.difference !== null;
    return signed(
      [
        m.hello,
        "",
        fill(m.ask, { period: docPeriod(t.common.period, r.fromDay, r.toDay, lang) }),
        "",
        withMath
          ? fill(m.expected, { hours, rate: money(r.rate!), expected: money(r.expected!), received: money(r.received), difference: money(r.difference!) })
          : fill(m.hoursOnly, { hours, received: money(r.received) }),
        "",
        m.attached,
        "",
        m.bye,
      ],
      r.name,
    );
  });
}

export function accountantMessages(a: { fromKey: string; toKey: string; mode: "pf" | "cnpj"; name: string | null }) {
  return both((lang) => {
    const m = getDocDictionary(lang).messages.accountant;
    const items = a.mode === "cnpj" ? [m.items.report, m.items.sheet, m.items.statements, m.items.proLabore] : [m.items.report, m.items.sheet, m.items.statements, m.items.darf];
    return signed(
      [
        m.hello,
        "",
        fill(m.ask, { from: docMonth(a.fromKey, lang), to: docMonth(a.toKey, lang) }),
        a.mode === "cnpj" ? m.cnpj : m.pf,
        "",
        m.attached,
        ...items.map((item) => `- ${item}`),
        "",
        m.more,
      ],
      a.name,
    );
  });
}
