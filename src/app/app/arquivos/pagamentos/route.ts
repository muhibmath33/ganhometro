// The payments spreadsheet for the accountant (CSV): ?de=2026-08&ate=2026-10&lang=pt
import { parseDocLang } from "@/i18n/documents";
import { profileLocale, requireUser } from "@/lib/app/session";
import { dayKey } from "@/lib/app/time";
import { fileName } from "@/lib/documents/format";
import { isMonthKey, loadIncome } from "@/lib/documents/load";
import { monthKeys, toCsv } from "@/lib/money/reports";

const HEADERS = {
  pt: ["Data", "Fonte pagadora", "Moeda", "Valor", "Cotação usada (R$)", "Data da cotação", "Valor em reais", "Chegou na conta (R$)", "Meio"],
  en: ["Date", "Paid by", "Currency", "Amount", "Rate used (BRL)", "Rate date", "Amount in BRL", "Arrived in the account (BRL)", "Method"],
};

export async function GET(request: Request) {
  const { supabase, profile, user } = await requireUser();
  const params = new URL(request.url).searchParams;
  const from = params.get("de");
  const to = params.get("ate");
  if (!isMonthKey(from) || !isMonthKey(to) || from > to || monthKeys(from, to).length > 24) return new Response("Bad period", { status: 400 });
  const lang = parseDocLang(params.get("lang"), profileLocale(profile) === "en" ? "en" : "pt");
  const { rows } = await loadIncome(supabase, profile, user.id, from, to, dayKey(new Date(), profile.timezone));
  const csv = toCsv(
    [
      HEADERS[lang],
      ...rows.map((r) => [
        r.received_on,
        r.source,
        r.currency,
        r.amount,
        r.rate === null ? null : Math.round(r.rate * 10_000) / 10_000,
        r.rateDay,
        r.brl,
        r.arrivedBrl,
        r.method,
      ]),
    ],
    lang,
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName(lang === "en" ? "payments" : "recebimentos", from, to)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
