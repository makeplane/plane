// plane imports
import { EProductSubscriptionEnum } from "@plane/types";
import { cn } from "@plane/utils";

export const getSubscriptionTextColor = (
  planVariant: EProductSubscriptionEnum,
  shade: "200" | "400" = "200"
): string => {
  const subscriptionColors = {
    [EProductSubscriptionEnum.ONE]: {
      "200": "text-custom-subscription-one-200",
      "400": "text-custom-subscription-one-400",
    },
    [EProductSubscriptionEnum.PRO]: {
      "200": "text-custom-subscription-pro-200",
      "400": "text-custom-subscription-pro-400",
    },
    [EProductSubscriptionEnum.BUSINESS]: {
      "200": "text-custom-subscription-business-200",
      "400": "text-custom-subscription-business-400",
    },
    [EProductSubscriptionEnum.ENTERPRISE]: {
      "200": "text-custom-subscription-enterprise-200",
      "400": "text-custom-subscription-enterprise-400",
    },
    [EProductSubscriptionEnum.FREE]: {
      "200": "text-custom-subscription-free-200",
      "400": "text-custom-subscription-free-400",
    },
  };

  return subscriptionColors[planVariant]?.[shade] ?? subscriptionColors[EProductSubscriptionEnum.FREE][shade];
};

export const getSubscriptionBackgroundColor = (
  planVariant: EProductSubscriptionEnum,
  shade: "50" | "100" | "200" | "400" = "100"
): string => {
  const subscriptionColors = {
    [EProductSubscriptionEnum.ONE]: {
      "50": "bg-custom-subscription-one-200/10",
      "100": "bg-custom-subscription-one-200/20",
      "200": "bg-custom-subscription-one-200",
      "400": "bg-custom-subscription-one-400",
    },
    [EProductSubscriptionEnum.PRO]: {
      "50": "bg-custom-subscription-pro-200/10",
      "100": "bg-custom-subscription-pro-200/20",
      "200": "bg-custom-subscription-pro-200",
      "400": "bg-custom-subscription-pro-400",
    },
    [EProductSubscriptionEnum.BUSINESS]: {
      "50": "bg-custom-subscription-business-200/10",
      "100": "bg-custom-subscription-business-200/20",
      "200": "bg-custom-subscription-business-200",
      "400": "bg-custom-subscription-business-400",
    },
    [EProductSubscriptionEnum.ENTERPRISE]: {
      "50": "bg-custom-subscription-enterprise-200/10",
      "100": "bg-custom-subscription-enterprise-200/20",
      "200": "bg-custom-subscription-enterprise-200",
      "400": "bg-custom-subscription-enterprise-400",
    },
    [EProductSubscriptionEnum.FREE]: {
      "50": "bg-custom-subscription-free-200/10",
      "100": "bg-custom-subscription-free-200/20",
      "200": "bg-custom-subscription-free-200",
      "400": "bg-custom-subscription-free-400",
    },
  };

  return subscriptionColors[planVariant]?.[shade] ?? subscriptionColors[EProductSubscriptionEnum.FREE][shade];
};

export const getSubscriptionBorderColor = (
  planVariant: EProductSubscriptionEnum,
  shade: "200" | "400" = "200"
): string => {
  const subscriptionColors = {
    [EProductSubscriptionEnum.ONE]: {
      "200": "border-custom-subscription-one-200",
      "400": "border-custom-subscription-one-400",
    },
    [EProductSubscriptionEnum.PRO]: {
      "200": "border-custom-subscription-pro-200",
      "400": "border-custom-subscription-pro-400",
    },
    [EProductSubscriptionEnum.BUSINESS]: {
      "200": "border-custom-subscription-business-200",
      "400": "border-custom-subscription-business-400",
    },
    [EProductSubscriptionEnum.ENTERPRISE]: {
      "200": "border-custom-subscription-enterprise-200",
      "400": "border-custom-subscription-enterprise-400",
    },
    [EProductSubscriptionEnum.FREE]: {
      "200": "border-custom-subscription-free-200",
      "400": "border-custom-subscription-free-400",
    },
    default: "border-custom-subscription-free-400",
  };

  return subscriptionColors[planVariant]?.[shade] ?? subscriptionColors.default;
};

export const getUpgradeButtonStyle = (
  planVariant: EProductSubscriptionEnum,
  isDisabled: boolean
): string | undefined => {
  const baseClassNames = "border bg-custom-background-100";
  const hoverClassNames = !isDisabled ? "hover:text-white hover:bg-gradient-to-br" : "";
  const disabledClassNames = isDisabled ? "opacity-70 cursor-not-allowed" : "";

  const COMMON_CLASSNAME = cn(baseClassNames, hoverClassNames, disabledClassNames);

  switch (planVariant) {
    case EProductSubscriptionEnum.ENTERPRISE:
      return cn(
        "text-custom-subscription-enterprise-200 from-custom-subscription-enterprise-200 to-custom-subscription-enterprise-400",
        getSubscriptionBorderColor(planVariant, "200"),
        COMMON_CLASSNAME
      );
    case EProductSubscriptionEnum.BUSINESS:
      return cn(
        "text-custom-subscription-business-200 from-custom-subscription-business-200 to-custom-subscription-business-400",
        getSubscriptionBorderColor(planVariant, "200"),
        COMMON_CLASSNAME
      );
    case EProductSubscriptionEnum.PRO:
      return cn(
        "text-custom-subscription-pro-200 from-custom-subscription-pro-200 to-custom-subscription-pro-400",
        getSubscriptionBorderColor(planVariant, "200"),
        COMMON_CLASSNAME
      );
    case EProductSubscriptionEnum.ONE:
      return cn(
        "text-custom-subscription-one-200 from-custom-subscription-one-200 to-custom-subscription-one-400",
        getSubscriptionBorderColor(planVariant, "200"),
        COMMON_CLASSNAME
      );
    case EProductSubscriptionEnum.FREE:
    default:
      return cn(
        "text-custom-subscription-free-200 from-custom-subscription-free-200 to-custom-subscription-free-400",
        getSubscriptionBorderColor(planVariant, "200"),
        COMMON_CLASSNAME
      );
  }
};

export const getUpgradeCardVariantStyle = (planVariant: EProductSubscriptionEnum): string | undefined => {
  const COMMON_CLASSNAME = cn("bg-gradient-to-b from-0% to-40% border border-custom-border-200 rounded-xl");

  switch (planVariant) {
    case EProductSubscriptionEnum.ENTERPRISE:
      return cn("from-custom-subscription-enterprise-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.BUSINESS:
      return cn("from-custom-subscription-business-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.PRO:
      return cn("from-custom-subscription-pro-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.ONE:
      return cn("from-custom-subscription-one-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.FREE:
    default:
      return cn("from-custom-subscription-free-200/[0.14] to-transparent", COMMON_CLASSNAME);
  }
};

export const getSuccessModalVariantStyle = (planVariant: EProductSubscriptionEnum) => {
  const COMMON_CLASSNAME = cn("bg-gradient-to-b from-0% to-30% rounded-2xl");

  switch (planVariant) {
    case EProductSubscriptionEnum.ENTERPRISE:
      return cn("from-custom-subscription-enterprise-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.BUSINESS:
      return cn("from-custom-subscription-business-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.PRO:
      return cn("from-custom-subscription-pro-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.ONE:
      return cn("from-custom-subscription-one-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.FREE:
    default:
      return cn("from-custom-subscription-free-200/[0.14] to-transparent", COMMON_CLASSNAME);
  }
};

export const getBillingAndPlansCardVariantStyle = (planVariant: EProductSubscriptionEnum) => {
  const COMMON_CLASSNAME = cn("bg-gradient-to-b from-0% to-50%");

  switch (planVariant) {
    case EProductSubscriptionEnum.ENTERPRISE:
      return cn("from-custom-subscription-enterprise-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.BUSINESS:
      return cn("from-custom-subscription-business-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.PRO:
      return cn("from-custom-subscription-pro-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.ONE:
      return cn("from-custom-subscription-one-200/[0.14] to-transparent", COMMON_CLASSNAME);
    case EProductSubscriptionEnum.FREE:
    default:
      return cn("from-custom-subscription-free-200/[0.14] to-transparent", COMMON_CLASSNAME);
  }
};

export const getSubscriptionTextAndBackgroundColor = (planVariant: EProductSubscriptionEnum) =>
  cn(getSubscriptionTextColor(planVariant), getSubscriptionBackgroundColor(planVariant));

export const getDiscountPillStyle = (planVariant: EProductSubscriptionEnum): string =>
  cn(getSubscriptionBackgroundColor(planVariant, "200"), "text-white");
