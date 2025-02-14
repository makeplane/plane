import { TProductSubscriptionType } from "@plane/types";

export const calculateYearlyDiscount = (monthlyPrice: number, yearlyPricePerMonth: number): number => {
  const monthlyCost = monthlyPrice * 12;
  const yearlyCost = yearlyPricePerMonth * 12;
  const amountSaved = monthlyCost - yearlyCost;
  const discountPercentage = (amountSaved / monthlyCost) * 100;
  return Math.floor(discountPercentage);
};

export const getBasePlanName = (planVariant: TProductSubscriptionType, isSelfHosted: boolean): string => {
  if (planVariant === "ONE") return "Free";
  if (planVariant === "PRO") return isSelfHosted ? "One" : "Free";
  if (planVariant === "BUSINESS") return "Pro";
  if (planVariant === "ENTERPRISE") return "Business";
  return "--";
};
