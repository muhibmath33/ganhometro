// Timesheet PDF, or the payment review pack with revisao=1:
// ?fonte=<source id>&projeto=<project id>&de=2026-10-01&ate=2026-10-14&lang=en&tipo=pagas|todas
import { createElement } from "react";
import { parseDocLang } from "@/i18n/documents";
import { isPro, requireUser } from "@/lib/app/session";
import { addDays, dayKey, isDay } from "@/lib/app/time";
import { fileName } from "@/lib/documents/format";
import { holderOf, loadReview, loadTimesheet } from "@/lib/documents/load";
import { pdfResponse, TimesheetPdf } from "@/lib/documents/pdf";

export async function GET(request: Request) {
  const { supabase, profile, user } = await requireUser();
  // Documents are Pro.
  if (!isPro(profile)) return Response.redirect(new URL("/app/plano", request.url), 303);
  const params = new URL(request.url).searchParams;
  const sourceId = params.get("fonte") ?? "";
  const from = params.get("de") ?? "";
  const to = params.get("ate") ?? "";
  // Up to a year at a time.
  if (!sourceId || !isDay(from) || !isDay(to) || to < from || addDays(from, 366) < to) return new Response("Bad request", { status: 400 });
  const query = { sourceId, projectId: params.get("projeto") || null, fromDay: from, toDay: to };
  // Timesheets for clients and platforms abroad default to English.
  const lang = parseDocLang(params.get("lang"), "en");
  const review = params.get("revisao") === "1";
  const now = Date.now();
  const tz = profile.timezone;
  const reviewData = review ? await loadReview(supabase, user.id, tz, query, lang, now) : null;
  const data = reviewData ?? (review ? null : await loadTimesheet(supabase, user.id, tz, { ...query, paidOnly: params.get("tipo") === "pagas" }, lang, now));
  if (!data) return new Response("Not found", { status: 404 });
  return pdfResponse(
    createElement(TimesheetPdf, {
      lang,
      worker: holderOf(profile),
      client: data.source.name,
      project: data.project?.name ?? null,
      fromDay: from,
      toDay: to,
      generatedOn: dayKey(new Date(now), tz),
      sheet: data.sheet,
      paidOnly: review || params.get("tipo") === "pagas",
      review: reviewData?.review,
    }),
    fileName(review ? (lang === "en" ? "payment-review" : "pedido-de-revisao") : lang === "en" ? "timesheet" : "folha-de-horas", data.source.name, from, to) + ".pdf",
  );
}
