import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { alternates, getDictionary } from "@/i18n";

const meta = getDictionary("pt-BR", "freelancers").meta;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
  alternates: alternates("freelancers", "pt-BR"),
};

export default function FreelancersPage() {
  return <LandingPage locale="pt-BR" audience="freelancers" />;
}
