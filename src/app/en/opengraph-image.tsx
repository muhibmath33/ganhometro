import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "Ganhômetro — what each platform really pays, per hour, in reais";
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage("en");
}
