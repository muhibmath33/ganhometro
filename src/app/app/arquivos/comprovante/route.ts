// Income report PDF: ?de=2026-08&ate=2026-10&lang=pt
import { createElement } from "react";
import { parseDocLang } from "@/i18n/documents";
import { isPro, profileLocale, requireUser } from "@/lib/app/session";
import { dayKey } from "@/lib/app/time";
import { fileName } from "@/lib/documents/format";
import { holderOf, isMonthKey, loadIncome } from "@/lib/documents/load";
import { IncomeReportPdf, pdfResponse } from "@/lib/documents/pdf";
import { monthKeys } from "@/lib/money/reports";

export async function GET(request: Request) {
  const { supabase, profile, user } = await requireUser();
  // Documents are Pro.
  if (!isPro(profile)) return Response.redirect(new URL("/app/plano", request.url), 303);
  const params = new URL(request.url).searchParams;
  const from = params.get("de");
  const to = params.get("ate");
  // Up to two years at a time.
  if (!isMonthKey(from) || !isMonthKey(to) || from > to || monthKeys(from, to).length > 24) return new Response("Bad period", { status: 400 });
  const lang = parseDocLang(params.get("lang"), profileLocale(profile) === "en" ? "en" : "pt");
  const today = dayKey(new Date(), profile.timezone);
  const { report, taxes } = await loadIncome(supabase, profile, user.id, from, to, today);
  return pdfResponse(
    createElement(IncomeReportPdf, { lang, holder: holderOf(profile), fromKey: from, toKey: to, generatedOn: today, report, taxes }),
    fileName(lang === "en" ? "income-statement" : "comprovante-de-rendimentos", from, to) + ".pdf",
  );
}
