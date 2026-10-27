import type { MetadataRoute } from "next";
import { locales, routes } from "@/i18n";
import { site } from "@/lib/site";

const abs = (path: string) => site.url + (path === "/" ? "" : path);

// Every page in both languages, each pointing to its translation. The founding offer page is temporary and
// stays out of search.
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.entries(routes)
    .filter(([key]) => key !== "founding")
    .flatMap(([, paths]) =>
    locales.map((locale) => ({
      url: abs(paths[locale]),
      alternates: { languages: { "pt-BR": abs(paths["pt-BR"]), en: abs(paths.en) } },
    })),
  );
}
