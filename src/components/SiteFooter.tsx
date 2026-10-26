import Link from "next/link";
import { fill, getDictionary, routes, type Locale } from "@/i18n";
import { site } from "@/lib/site";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).footer;
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-3 p-6 text-[13px] leading-[1.5] text-muted">
        <span>{t.copyright}</span>
        <div className="flex flex-wrap gap-4">
          <Link href={routes.privacy[locale]} className="underline">
            {t.privacy}
          </Link>
          <Link href={routes.terms[locale]} className="underline">
            {t.terms}
          </Link>
          <a href={`mailto:${site.contactEmail}`} className="underline">
            {fill(t.contact, { email: site.contactEmail })}
          </a>
        </div>
      </div>
    </footer>
  );
}
