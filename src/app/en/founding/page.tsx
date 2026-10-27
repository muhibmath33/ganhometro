import { FoundingPage, foundingMetadata } from "@/components/FoundingPage";

export const metadata = foundingMetadata("en");

export default function FoundingOfferPage({ searchParams }: PageProps<"/en/founding">) {
  return <FoundingPage locale="en" searchParams={searchParams} />;
}
