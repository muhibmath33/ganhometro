import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { UtmCapture } from "@/components/UtmCapture";
import { getDictionary } from "@/i18n";
import { site } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

// Portuguese is the default language; app/en/layout.tsx overrides these for English pages.
const meta = getDictionary("pt-BR").meta;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
    siteName: site.name,
    locale: meta.ogLocale,
    type: "website",
  },
};

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const plausibleSrc =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${jakarta.variable} ${jetbrains.variable} antialiased`}
    >
      <body className="font-sans">
        {children}
        <UtmCapture />
        {plausibleDomain && (
          <>
            <Script id="plausible-queue">
              {
                "window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}"
              }
            </Script>
            <Script data-domain={plausibleDomain} src={plausibleSrc} />
          </>
        )}
      </body>
    </html>
  );
}
