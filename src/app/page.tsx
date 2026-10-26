import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { alternates } from "@/i18n";

export const metadata: Metadata = {
  alternates: alternates("home", "pt-BR"),
};

export default function Home() {
  return <LandingPage locale="pt-BR" />;
}
