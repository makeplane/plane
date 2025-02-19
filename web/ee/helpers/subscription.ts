// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { cn } from "@plane/utils";

// --------------- NOTE ----------------
// This has to be in web application as tailwind won't be able to resolve the colors
// ------------------------------------

export const getSubscriptionTextColor = (planVariant: EProductSubscriptionEnum) => {
  switch (planVariant) {
    case EProductSubscriptionEnum.ONE:
      return "text-custom-text-subscription-one";
    case EProductSubscriptionEnum.PRO:
      return "text-custom-text-subscription-pro";
    case EProductSubscriptionEnum.BUSINESS:
      return "text-custom-text-subscription-business";
    case EProductSubscriptionEnum.FREE:
    default:
      return "text-custom-text-subscription-free";
  }
};

export const getSubscriptionBackgroundColor = (planVariant: EProductSubscriptionEnum) => {
  switch (planVariant) {
    case EProductSubscriptionEnum.ONE:
      return "bg-custom-background-subscription-one";
    case EProductSubscriptionEnum.PRO:
      return "bg-custom-background-subscription-pro";
    case EProductSubscriptionEnum.BUSINESS:
      return "bg-custom-background-subscription-business";
    case EProductSubscriptionEnum.FREE:
    default:
      return "bg-custom-background-subscription-free";
  }
};

export const getSubscriptionTextAndBackgroundColor = (planVariant: EProductSubscriptionEnum) =>
  cn(getSubscriptionTextColor(planVariant), getSubscriptionBackgroundColor(planVariant));
