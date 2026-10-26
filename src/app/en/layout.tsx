import type { Metadata } from "next";
import { HtmlLang } from "@/components/HtmlLang";
import { getDictionary } from "@/i18n";

const t = getDictionary("en").meta;

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
  openGraph: {
    title: t.title,
    description: t.description,
    siteName: "Ganhômetro",
    locale: t.ogLocale,
    type: "website",
  },
};

export default function EnglishLayout({ children }: LayoutProps<"/en">) {
  return (
    <div lang="en">
      <HtmlLang lang="en" />
      {children}
    </div>
  );
}
