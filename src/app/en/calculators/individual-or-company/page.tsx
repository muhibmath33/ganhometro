import { CompanyPage, calculatorMetadata } from "@/components/calculators/CalculatorPages";

export const metadata = calculatorMetadata("calcCompany", "en");

export default function EnglishCompanyRoute() {
  return <CompanyPage locale="en" />;
}
