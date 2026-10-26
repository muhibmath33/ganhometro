import { TakeHomePage, calculatorMetadata } from "@/components/calculators/CalculatorPages";

export const metadata = calculatorMetadata("calcTakeHome", "pt-BR");

export default function TakeHomeRoute() {
  return <TakeHomePage locale="pt-BR" />;
}
