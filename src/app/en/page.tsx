import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { alternates } from "@/i18n";

export const metadata: Metadata = {
  alternates: alternates("home", "en"),
};

export default function EnglishHome() {
  return <LandingPage locale="en" />;
}
