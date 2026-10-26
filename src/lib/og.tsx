import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getDictionary, type Locale } from "@/i18n";

export const ogSize = { width: 1200, height: 630 };

// Read at module level (as in the Next.js docs) so the images stay prerendered at build time.
const [semibold, extrabold] = await Promise.all([
  readFile(join(process.cwd(), "assets/fonts/plus-jakarta-sans-latin-600.woff")),
  readFile(join(process.cwd(), "assets/fonts/plus-jakarta-sans-latin-800.woff")),
]);

// Link preview for WhatsApp, Instagram and other social apps.
export function renderOgImage(locale: Locale) {
  const t = getDictionary(locale).meta;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#F6F4EE",
          color: "#13201B",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#0B6B4F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 2.5" />
              <path d="M9 2h6" />
            </svg>
          </div>
          <div style={{ fontSize: 40, fontWeight: 800 }}>Ganhômetro</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.02em" }}>
          {t.ogTitle}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#0B6B4F", fontWeight: 600 }}>
          {t.ogTagline}
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Plus Jakarta Sans", data: semibold, weight: 600, style: "normal" },
        { name: "Plus Jakarta Sans", data: extrabold, weight: 800, style: "normal" },
      ],
    },
  );
}
