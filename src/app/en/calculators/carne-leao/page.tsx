import { CarneLeaoPage, calculatorMetadata } from "@/components/calculators/CalculatorPages";

export const metadata = calculatorMetadata("calcCarneLeao", "en");

export default function EnglishCarneLeaoRoute() {
  return <CarneLeaoPage locale="en" />;
}
