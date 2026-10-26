import { CompanyPage, calculatorMetadata } from "@/components/calculators/CalculatorPages";

export const metadata = calculatorMetadata("calcCompany", "pt-BR");

export default function CompanyRoute() {
  return <CompanyPage locale="pt-BR" />;
}
