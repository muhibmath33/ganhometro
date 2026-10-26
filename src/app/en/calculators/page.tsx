import { CalculatorsIndexPage, calculatorMetadata } from "@/components/calculators/CalculatorPages";

export const metadata = calculatorMetadata("calculators", "en");

export default function EnglishCalculatorsPage() {
  return <CalculatorsIndexPage locale="en" />;
}
