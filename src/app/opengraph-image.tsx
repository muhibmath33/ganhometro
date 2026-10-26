import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "Ganhômetro — quanto cada plataforma paga de verdade, por hora, em reais";
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage("pt-BR");
}
