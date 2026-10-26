// The app's emails: HTML with inline styles (what email clients support) and a plain-text version.
import { fill, type Locale } from "@/i18n/config";
import { getEmailDictionary } from "@/i18n/emails";
import type { LateAlert } from "@/lib/app/alerts";
import { site } from "@/lib/site";
import type { Email } from "./send";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(locale: Locale, { title, paragraphs, list, button }: { title: string; paragraphs: string[]; list?: string[]; button: { label: string; path: string } }) {
  const f = getEmailDictionary(locale).footer;
  const url = `${site.url}${button.path}`;
  const settings = `${site.url}/app/ajustes`;
  const html = `<!doctype html><html lang="${locale}"><body style="margin:0;background:#F6F4EE;font-family:Helvetica,Arial,sans-serif;color:#13201B">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4EE;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #E4E0D5;border-radius:16px;padding:28px">
<tr><td style="font-size:18px;font-weight:800;color:#0B6B4F;padding-bottom:16px">Ganhômetro</td></tr>
<tr><td style="font-size:20px;font-weight:800;line-height:1.3;padding-bottom:12px">${esc(title)}</td></tr>
${paragraphs.map((p) => `<tr><td style="font-size:15px;line-height:1.55;color:#3E4A45;padding-bottom:12px">${esc(p)}</td></tr>`).join("")}
${list?.length ? `<tr><td style="padding-bottom:12px"><ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.6;color:#3E4A45">${list.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></td></tr>` : ""}
<tr><td style="padding:8px 0 20px"><a href="${esc(url)}" style="display:inline-block;background:#0B6B4F;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:10px">${esc(button.label)}</a></td></tr>
<tr><td style="border-top:1px solid #E4E0D5;padding-top:14px;font-size:12px;line-height:1.5;color:#5C6762">${esc(f.why)} ${esc(f.estimate)}<br><a href="${esc(settings)}" style="color:#0B6B4F">${esc(f.settings)}</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [title, "", ...paragraphs, ...(list?.length ? ["", ...list.map((l) => `- ${l}`)] : []), "", `${button.label}: ${url}`, "", `${f.why} ${f.estimate}`, `${f.settings}: ${settings}`].join("\n");
  return { html, text };
}

export function darfReminderEmail(
  locale: Locale,
  to: string,
  { mode, month, monthKey, amount, due, days }: { mode: "pf" | "cnpj"; month: string; monthKey: string; amount: string; due: string; days: 1 | 5 },
): Email {
  const d = getEmailDictionary(locale).darf;
  const subject = fill((mode === "cnpj" ? d.subjectCnpj : d.subject)[days], { month });
  return {
    to,
    subject,
    ...layout(locale, {
      title: subject,
      paragraphs: [fill(mode === "cnpj" ? d.bodyCnpj : d.body, { month, amount, due }), mode === "cnpj" ? d.howCnpj : d.how, d.paid],
      button: { label: d.button, path: `/app/impostos/${monthKey}` },
    }),
  };
}

export function latePaymentEmail(locale: Locale, to: string, alert: LateAlert, formatDay: (day: string) => string): Email {
  const d = getEmailDictionary(locale).late;
  const s = alert.schedule;
  const schedule =
    s.pay_schedule === "monthly"
      ? fill(d.schedules.monthly, { day: s.pay_day ?? "" })
      : fill(d.schedules[s.pay_schedule === "biweekly" ? "biweekly" : "weekly"], { weekday: d.weekdays[s.pay_weekday ?? 0] });
  const subject = fill(d.subject, { source: alert.name });
  return {
    to,
    subject,
    ...layout(locale, {
      title: subject,
      paragraphs: [fill(d.body, { source: alert.name, schedule, payday: formatDay(alert.payday), since: formatDay(alert.workSince) }), d.next],
      button: { label: d.button, path: "/app/pagamentos" },
    }),
  };
}

export function overdueInvoiceEmail(
  locale: Locale,
  to: string,
  i: { id: string; number: string; client: string; amount: string; balance: string; due: string },
): Email {
  const d = getEmailDictionary(locale).invoice;
  const subject = fill(d.subject, { number: i.number, client: i.client });
  return {
    to,
    subject,
    ...layout(locale, {
      title: subject,
      paragraphs: [fill(d.body, i), d.next],
      button: { label: d.button, path: `/app/faturas/${i.id}` },
    }),
  };
}

export type WeeklySummary = {
  from: string;
  to: string;
  hours: { total: string; paid: string; unpaid: string; share: string } | null;
  platforms: string[];
  month: string;
  received: string | null;
  kept: string | null;
  attention: string[];
};

export function weeklySummaryEmail(locale: Locale, to: string, w: WeeklySummary): Email {
  const d = getEmailDictionary(locale).weekly;
  const paragraphs = [w.hours ? fill(d.hours, w.hours) : d.noHours];
  if (w.platforms.length) paragraphs.push(`${d.platforms}: ${w.platforms.join(" · ")}`);
  paragraphs.push(
    w.received && w.kept
      ? `${fill(d.month, { month: w.month })}: ${fill(d.received, { amount: w.received })} · ${fill(d.kept, { amount: w.kept })}`
      : fill(d.noPayments, { month: w.month }),
  );
  if (w.attention.length) paragraphs.push(`${d.attention}:`);
  return {
    to,
    subject: fill(d.subject, { from: w.from, to: w.to }),
    ...layout(locale, { title: fill(d.title, { from: w.from, to: w.to }), paragraphs, list: w.attention, button: { label: d.button, path: "/app/painel" } }),
  };
}
