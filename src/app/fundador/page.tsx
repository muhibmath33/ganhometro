import { FoundingPage, foundingMetadata } from "@/components/FoundingPage";

export const metadata = foundingMetadata("pt-BR");

export default function FoundingOfferPage({ searchParams }: PageProps<"/fundador">) {
  return <FoundingPage locale="pt-BR" searchParams={searchParams} />;
}
