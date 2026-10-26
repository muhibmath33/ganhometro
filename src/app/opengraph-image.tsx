import { ImageResponse } from "next/og";

export const alt = "Ganho Real — quanto cada plataforma paga de verdade, por hora, em reais";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Link preview for WhatsApp, Instagram and other social apps.
export default function OpengraphImage() {
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
          <div style={{ fontSize: 40, fontWeight: 800 }}>Ganho Real</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.02em" }}>
          Descubra quanto cada plataforma paga de verdade, por hora, em reais.
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#0B6B4F", fontWeight: 700 }}>
          Para quem treina IA · Acesso antecipado grátis
        </div>
      </div>
    ),
    size,
  );
}
