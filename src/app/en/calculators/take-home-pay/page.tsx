import { TakeHomePage, calculatorMetadata } from "@/components/calculators/CalculatorPages";

export const metadata = calculatorMetadata("calcTakeHome", "en");

export default function EnglishTakeHomeRoute() {
  return <TakeHomePage locale="en" />;
}
