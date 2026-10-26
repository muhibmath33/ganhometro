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

// Umami Cloud: free, cookieless analytics. Off until the website ID is set.
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC || "https://cloud.umami.is/script.js";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${jakarta.variable} ${jetbrains.variable} antialiased`}
    >
      <body className="font-sans">
        {children}
        <UtmCapture />
        {umamiWebsiteId && <Script src={umamiSrc} data-website-id={umamiWebsiteId} strategy="afterInteractive" />}
      </body>
    </html>
  );
}
