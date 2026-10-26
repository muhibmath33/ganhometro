import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/privacidade", "/termos"].map((path) => ({ url: `${site.url}${path}` }));
}
