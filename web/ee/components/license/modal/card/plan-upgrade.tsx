"use client";

import { FC } from "react";
import orderBy from "lodash/orderBy";
import { CheckCircle } from "lucide-react";
import { Tab } from "@headlessui/react";
// types
import { IPaymentProduct, TProductSubscriptionType } from "@plane/types";
// ui
import { getButtonStyling, Loader } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web services
import { TPriceFrequency, TStripeCheckoutParams } from "@/plane-web/components/license/modal";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export type PlanUpgradeCardProps = {
  planVariant: TProductSubscriptionType;
  isLoading?: boolean;
  product: IPaymentProduct | undefined;
  features: string[];
  upgradeCTA?: string;
  upgradeLoaderType: Omit<TProductSubscriptionType, "FREE"> | undefined;
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
  selectedPlan: TPriceFrequency;
  renderTrialButton?: (props: { productId: string | undefined; priceId: string | undefined }) => React.ReactNode;
  setSelectedPlan: (recurring: TPriceFrequency) => void;
  handleCheckout: (params: TStripeCheckoutParams) => void;
};

type TCurrentPlanPrice = {
  key: string;
  id: string | undefined;
  currency: string;
  price: number;
  recurring: TPriceFrequency;
};

// constants
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

const getDiscountPillStyle = (planVariant: TProductSubscriptionType): string => {
  switch (planVariant) {
    case "PRO":
      return "bg-gradient-to-r from-[#C78401] to-[#896828] text-white";
    default:
      return "bg-custom-primary-300 text-white";
  }
};

const getUpgradeButtonStyle = (planVariant: TProductSubscriptionType, isDisabled: boolean): string => {
  switch (planVariant) {
    case "PRO":
      return cn("text-white border border-[#E9DBBF99]/60 bg-gradient-to-r from-[#C78401] to-[#896828]", {
        "opacity-70 cursor-not-allowed": isDisabled,
      });
    default:
      return getButtonStyling("primary", "lg", isDisabled);
  }
};

export const PlanUpgradeCard: FC<PlanUpgradeCardProps> = (props) => {
  const {
    planVariant,
    features,
    isLoading,
    product,
    upgradeCTA,
    verticalFeatureList = false,
    extraFeatures,
    upgradeLoaderType,
    selectedPlan,
    renderTrialButton,
    setSelectedPlan,
    handleCheckout,
  } = props;
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isSelfHosted = !!subscriptionDetail?.is_self_managed;
  const isTrialAllowed = !!subscriptionDetail?.is_trial_allowed;
  const basePlan = getBasePlanName(planVariant, isSelfHosted);
  // price details
  const productPrices = product?.prices || [];
  const monthlyPriceDetails = orderBy(productPrices, ["recurring"], ["desc"])?.find(
    (price) => price.recurring === "month"
  );
  const monthlyPrice = (monthlyPriceDetails?.unit_amount || 0) / 100;
  const yearlyPriceDetails = orderBy(productPrices, ["recurring"], ["desc"])?.find(
    (price) => price.recurring === "year"
  );
  const yearlyPrice = (yearlyPriceDetails?.unit_amount || 0) / 1200;
  const yearlyDiscount = calculateYearlyDiscount(monthlyPrice, yearlyPrice);

  // Plane details
  const planeName = planVariant.charAt(0).toUpperCase() + planVariant.slice(1).toLowerCase();

  const CURRENT_PLAN_PRICES: TCurrentPlanPrice[] = [
    {
      key: "monthly",
      id: monthlyPriceDetails?.id,
      currency: "$",
      price: Number(monthlyPrice?.toFixed(2)),
      recurring: "month",
    },
    {
      key: "yearly",
      id: yearlyPriceDetails?.id,
      currency: "$",
      price: Number(yearlyPrice?.toFixed(2)),
      recurring: "year",
    },
  ];

  return (
    <div className="flex flex-col py-4 px-2 border border-custom-primary-200/30 rounded-xl bg-custom-primary-200/5">
      <Tab.Group selectedIndex={selectedPlan === "month" ? 0 : 1}>
        <div className="flex w-full justify-center h-10">
          <Tab.List className="flex space-x-1 rounded-lg bg-custom-primary-200/10 p-1 w-60">
            {CURRENT_PLAN_PRICES.map((price: TCurrentPlanPrice) => (
              <Tab
                key={price.key}
                className={({ selected }) =>
                  cn(
                    "w-full rounded-lg py-1.5 text-sm font-medium leading-5",
                    selected
                      ? "bg-custom-background-100 text-custom-primary-300 shadow"
                      : "hover:bg-custom-primary-100/5 text-custom-text-300 hover:text-custom-text-200"
                  )
                }
                onClick={() => setSelectedPlan(price.recurring)}
              >
                <>
                  {price.recurring === "month" && ("Monthly" as string)}
                  {price.recurring === "year" && ("Yearly" as string)}
                  {price.recurring === "year" && yearlyDiscount > 0 && (
                    <span className={cn(getDiscountPillStyle(planVariant), "rounded-full px-2 py-1 ml-1 text-xs")}>
                      -{yearlyDiscount}%
                    </span>
                  )}
                </>
              </Tab>
            ))}
          </Tab.List>
        </div>
        <Tab.Panels>
          {CURRENT_PLAN_PRICES.map((price: TCurrentPlanPrice) => (
            <Tab.Panel key={price.key}>
              <div className="pt-6 pb-4 text-center font-semibold">
                <div className="text-2xl">Plane {planeName}</div>
                <div className="text-3xl h-11">
                  {isLoading ? (
                    <Loader className="flex flex-col items-center justify-center">
                      <Loader.Item height="36px" width="4rem" />
                    </Loader>
                  ) : (
                    <>
                      {price.currency}
                      {price.price}
                    </>
                  )}
                </div>
                <div className="text-sm text-custom-text-300">a user per month</div>
              </div>
              {isLoading ? (
                <Loader className="flex flex-col items-center justify-center">
                  <Loader.Item height="40px" width="14rem" />
                </Loader>
              ) : (
                <div className="flex flex-col items-center justify-center w-full">
                  <button
                    className={cn(
                      getUpgradeButtonStyle(planVariant, !!upgradeLoaderType),
                      "relative inline-flex items-center justify-center w-56 px-4 py-2.5 text-sm font-medium rounded-lg focus:outline-none"
                    )}
                    onClick={() => {
                      if (product && price.id) {
                        handleCheckout({
                          planVariant,
                          productId: product.id,
                          priceId: price.id,
                        });
                      }
                    }}
                    disabled={!!upgradeLoaderType}
                  >
                    {upgradeLoaderType === planVariant
                      ? "Redirecting to Stripe..."
                      : (upgradeCTA ?? `Upgrade to ${planeName}`)}
                  </button>
                  {isTrialAllowed &&
                    renderTrialButton &&
                    renderTrialButton({
                      productId: product?.id,
                      priceId: price.id,
                    })}
                </div>
              )}
              <div className="px-2 pt-6 pb-2">
                <div className="p-2 text-sm font-semibold">{`Everything in ${basePlan} +`}</div>
                <ul className="grid grid-cols-12 gap-x-4">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className={cn("col-span-12 relative rounded-md p-2 flex", {
                        "sm:col-span-6": !verticalFeatureList,
                      })}
                    >
                      <p className="w-full text-sm font-medium leading-5 flex items-center line-clamp-1">
                        <CheckCircle className="h-4 w-4 mr-4 text-custom-text-300 flex-shrink-0" />
                        <span className="text-custom-text-200 truncate">{feature}</span>
                      </p>
                    </li>
                  ))}
                </ul>
                {extraFeatures && <div>{extraFeatures}</div>}
              </div>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
