import { CalculatorsIndexPage, calculatorMetadata } from "@/components/calculators/CalculatorPages";

export const metadata = calculatorMetadata("calculators", "pt-BR");

export default function CalculatorsPage() {
  return <CalculatorsIndexPage locale="pt-BR" />;
}
