import type { IPaymentProduct, TBillingFrequency, TProductBillingFrequency } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";

/**
 * Default billing frequency for each product subscription type
 */
export const DEFAULT_PRODUCT_BILLING_FREQUENCY: TProductBillingFrequency = {
  [EProductSubscriptionEnum.FREE]: undefined,
  [EProductSubscriptionEnum.ONE]: undefined,
  [EProductSubscriptionEnum.PRO]: "month",
  [EProductSubscriptionEnum.BUSINESS]: "month",
  [EProductSubscriptionEnum.ENTERPRISE]: "month",
};

/**
 * Subscription types that support billing frequency toggle (monthly/yearly)
 */
export const SUBSCRIPTION_WITH_BILLING_FREQUENCY = [
  EProductSubscriptionEnum.PRO,
  EProductSubscriptionEnum.BUSINESS,
  EProductSubscriptionEnum.ENTERPRISE,
];

/**
 * Mapping of product subscription types to their respective payment product details
 * Used to provide information about each product's pricing and features
 */
export const PLANE_COMMUNITY_PRODUCTS: Record<string, IPaymentProduct> = {
  [EProductSubscriptionEnum.PRO]: {
    id: EProductSubscriptionEnum.PRO,
    name: "Plane Pro",
    description:
      "More views, more cycles powers, more pages features, new reports, and better dashboards are waiting to be unlocked.",
    type: "PRO",
    prices: [
      {
        id: `price_monthly_${EProductSubscriptionEnum.PRO}`,
        unit_amount: 800,
        recurring: "month",
        currency: "usd",
        workspace_amount: 800,
        product: EProductSubscriptionEnum.PRO,
      },
      {
        id: `price_yearly_${EProductSubscriptionEnum.PRO}`,
        unit_amount: 7200,
        recurring: "year",
        currency: "usd",
        workspace_amount: 7200,
        product: EProductSubscriptionEnum.PRO,
      },
    ],
    payment_quantity: 1,
    is_active: true,
  },
  [EProductSubscriptionEnum.BUSINESS]: {
    id: EProductSubscriptionEnum.BUSINESS,
    name: "Plane Business",
    description:
      "The earliest packaging of Business at $10 a seat a month billed annually, $12 a seat a month billed monthly for Plane Cloud",
    type: "BUSINESS",
    prices: [
      {
        id: `price_yearly_${EProductSubscriptionEnum.BUSINESS}`,
        unit_amount: 15600,
        recurring: "year",
        currency: "usd",
        workspace_amount: 15600,
        product: EProductSubscriptionEnum.BUSINESS,
      },
      {
        id: `price_monthly_${EProductSubscriptionEnum.BUSINESS}`,
        unit_amount: 1500,
        recurring: "month",
        currency: "usd",
        workspace_amount: 1500,
        product: EProductSubscriptionEnum.BUSINESS,
      },
    ],
    payment_quantity: 1,
    is_active: true,
  },
  [EProductSubscriptionEnum.ENTERPRISE]: {
    id: EProductSubscriptionEnum.ENTERPRISE,
    name: "Plane Enterprise",
    description: "",
    type: "ENTERPRISE",
    prices: [
      {
        id: `price_yearly_${EProductSubscriptionEnum.ENTERPRISE}`,
        unit_amount: 0,
        recurring: "year",
        currency: "usd",
        workspace_amount: 0,
        product: EProductSubscriptionEnum.ENTERPRISE,
      },
      {
        id: `price_monthly_${EProductSubscriptionEnum.ENTERPRISE}`,
        unit_amount: 0,
        recurring: "month",
        currency: "usd",
        workspace_amount: 0,
        product: EProductSubscriptionEnum.ENTERPRISE,
      },
    ],
    payment_quantity: 1,
    is_active: false,
  },
};

// External URLs removed for government deployment
/**
 * URL for the "Talk to Sales" page - disabled for government deployment
 */
export const TALK_TO_SALES_URL = "";

/**
 * Mapping of subscription types to their respective upgrade/redirection URLs based on billing frequency
 * All external URLs removed for government deployment
 */
export const SUBSCRIPTION_REDIRECTION_URLS: Record<EProductSubscriptionEnum, Record<TBillingFrequency, string>> = {
  [EProductSubscriptionEnum.FREE]: {
    month: "",
    year: "",
  },
  [EProductSubscriptionEnum.ONE]: {
    month: "",
    year: "",
  },
  [EProductSubscriptionEnum.PRO]: {
    month: "",
    year: "",
  },
  [EProductSubscriptionEnum.BUSINESS]: {
    month: "",
    year: "",
  },
  [EProductSubscriptionEnum.ENTERPRISE]: {
    month: "",
    year: "",
  },
};

/**
 * Mapping of subscription types to their respective marketing webpage URLs
 * All external URLs removed for government deployment
 */
export const SUBSCRIPTION_WEBPAGE_URLS: Record<EProductSubscriptionEnum, string> = {
  [EProductSubscriptionEnum.FREE]: "",
  [EProductSubscriptionEnum.ONE]: "",
  [EProductSubscriptionEnum.PRO]: "",
  [EProductSubscriptionEnum.BUSINESS]: "",
  [EProductSubscriptionEnum.ENTERPRISE]: "",
};
