// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { TProductSubscriptionType } from "@plane/types";

export const calculateYearlyDiscount = (monthlyPrice: number, yearlyPricePerMonth: number): number => {
  const monthlyCost = monthlyPrice * 12;
  const yearlyCost = yearlyPricePerMonth * 12;
  const amountSaved = monthlyCost - yearlyCost;
  const discountPercentage = (amountSaved / monthlyCost) * 100;
  return Math.floor(discountPercentage);
};

export const getSubscriptionName = (planVariant: EProductSubscriptionEnum): string => {
  switch (planVariant) {
    case EProductSubscriptionEnum.FREE:
      return "Free";
    case EProductSubscriptionEnum.ONE:
      return "One";
    case EProductSubscriptionEnum.PRO:
      return "Pro";
    case EProductSubscriptionEnum.BUSINESS:
      return "Business";
    case EProductSubscriptionEnum.ENTERPRISE:
      return "Enterprise";
    default:
      return "--";
  }
};

export const getBaseSubscriptionName = (planVariant: TProductSubscriptionType, isSelfHosted: boolean): string => {
  switch (planVariant) {
    case EProductSubscriptionEnum.ONE:
      return getSubscriptionName(EProductSubscriptionEnum.FREE);
    case EProductSubscriptionEnum.PRO:
      return isSelfHosted
        ? getSubscriptionName(EProductSubscriptionEnum.ONE)
        : getSubscriptionName(EProductSubscriptionEnum.FREE);
    case EProductSubscriptionEnum.BUSINESS:
      return getSubscriptionName(EProductSubscriptionEnum.PRO);
    case EProductSubscriptionEnum.ENTERPRISE:
      return getSubscriptionName(EProductSubscriptionEnum.BUSINESS);
    default:
      return "--";
  }
};
