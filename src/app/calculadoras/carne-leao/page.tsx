import { CarneLeaoPage, calculatorMetadata } from "@/components/calculators/CalculatorPages";

export const metadata = calculatorMetadata("calcCarneLeao", "pt-BR");

export default function CarneLeaoRoute() {
  return <CarneLeaoPage locale="pt-BR" />;
}
