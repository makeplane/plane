import orderBy from "lodash/orderBy";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { IPaymentProduct, TProductSubscriptionType, TSubscriptionPrice } from "@plane/types";

/**
 * Calculates the yearly discount percentage when switching from monthly to yearly billing
 * @param monthlyPrice - The monthly subscription price
 * @param yearlyPricePerMonth - The monthly equivalent price when billed yearly
 * @returns The discount percentage as a whole number (floored)
 */
export const calculateYearlyDiscount = (monthlyPrice: number, yearlyPricePerMonth: number): number => {
  const monthlyCost = monthlyPrice * 12;
  const yearlyCost = yearlyPricePerMonth * 12;
  const amountSaved = monthlyCost - yearlyCost;
  const discountPercentage = (amountSaved / monthlyCost) * 100;
  return Math.floor(discountPercentage);
};

/**
 * Gets the display name for a subscription plan variant
 * @param planVariant - The subscription plan variant enum
 * @returns The human-readable name of the plan
 */
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

/**
 * Gets the base subscription name for upgrade/downgrade paths
 * @param planVariant - The current subscription plan variant
 * @param isSelfHosted - Whether the instance is self-hosted / community
 * @returns The name of the base subscription plan
 *
 * @remarks
 * - For self-hosted / community instances, the upgrade path differs from cloud instances
 * - Returns the immediate lower tier subscription name
 */
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

export type TSubscriptionPriceDetail = {
  monthlyPriceDetails: TSubscriptionPrice;
  yearlyPriceDetails: TSubscriptionPrice;
};

/**
 * Gets the price details for a subscription product
 * @param product - The payment product to get price details for
 * @returns Array of price details for monthly and yearly plans
 */
export const getSubscriptionPriceDetails = (product: IPaymentProduct | undefined): TSubscriptionPriceDetail => {
  const productPrices = product?.prices || [];
  const monthlyPriceDetails = orderBy(productPrices, ["recurring"], ["desc"])?.find(
    (price) => price.recurring === "month"
  );
  const monthlyPriceAmount = Number(((monthlyPriceDetails?.unit_amount || 0) / 100).toFixed(2));
  const yearlyPriceDetails = orderBy(productPrices, ["recurring"], ["desc"])?.find(
    (price) => price.recurring === "year"
  );
  const yearlyPriceAmount = Number(((yearlyPriceDetails?.unit_amount || 0) / 1200).toFixed(2));

  return {
    monthlyPriceDetails: {
      key: "monthly",
      id: monthlyPriceDetails?.id,
      currency: "$",
      price: monthlyPriceAmount,
      recurring: "month",
    },
    yearlyPriceDetails: {
      key: "yearly",
      id: yearlyPriceDetails?.id,
      currency: "$",
      price: yearlyPriceAmount,
      recurring: "year",
    },
  };
};
