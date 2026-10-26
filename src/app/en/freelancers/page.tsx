import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { alternates, getDictionary } from "@/i18n";

const meta = getDictionary("en", "freelancers").meta;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
  alternates: alternates("freelancers", "en"),
};

export default function EnglishFreelancersPage() {
  return <LandingPage locale="en" audience="freelancers" />;
}
