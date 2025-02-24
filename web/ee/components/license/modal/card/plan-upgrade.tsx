"use client";

import { FC } from "react";
import orderBy from "lodash/orderBy";
import { observer } from "mobx-react";
// plane imports
import { IPaymentProduct, TProductSubscriptionType } from "@plane/types";
import { getButtonStyling, Loader } from "@plane/ui";
import { calculateYearlyDiscount, cn } from "@plane/utils";
// plane web imports
import { TalkToSalesCard, TStripeCheckoutParams } from "@/plane-web/components/license/modal";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// local imports
import {
  BasePaidPlanCard,
  TCurrentPlanPrice,
  getDiscountPillStyle,
  getUpgradeButtonStyle,
} from "./base-paid-plan-card";

export type PlanUpgradeCardProps = {
  planVariant: TProductSubscriptionType;
  isLoading?: boolean;
  product: IPaymentProduct | undefined;
  features: string[];
  upgradeCTA?: string;
  upgradeLoaderType: Omit<TProductSubscriptionType, "FREE"> | undefined;
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
  renderTrialButton?: (props: { productId: string | undefined; priceId: string | undefined }) => React.ReactNode;
  handleCheckout: (params: TStripeCheckoutParams) => void;
};

export const PlanUpgradeCard: FC<PlanUpgradeCardProps> = observer((props) => {
  const {
    planVariant,
    features,
    isLoading,
    product,
    upgradeCTA,
    verticalFeatureList = false,
    extraFeatures,
    upgradeLoaderType,
    renderTrialButton,
    handleCheckout,
  } = props;
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isTrialAllowed = !!subscriptionDetail?.is_trial_allowed;
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

  if (!product?.is_active) {
    return (
      <TalkToSalesCard
        planVariant={planVariant}
        href="https://plane.so/talk-to-sales"
        isLoading={isLoading}
        features={features}
        prices={CURRENT_PLAN_PRICES}
        upgradeLoaderType={upgradeLoaderType}
        verticalFeatureList={verticalFeatureList}
        extraFeatures={extraFeatures}
      />
    );
  }

  const renderPriceContent = (price: TCurrentPlanPrice) => (
    <>
      {price.recurring === "month" && "Monthly"}
      {price.recurring === "year" && (
        <>
          Yearly
          {yearlyDiscount > 0 && (
            <span className={cn(getDiscountPillStyle(planVariant), "rounded-full px-2 py-1 ml-1 text-xs")}>
              -{yearlyDiscount}%
            </span>
          )}
        </>
      )}
    </>
  );

  const renderActionButton = (price: TCurrentPlanPrice) => {
    const upgradeButtonStyle =
      getUpgradeButtonStyle(planVariant, !!upgradeLoaderType) ?? getButtonStyling("primary", "lg", !!upgradeLoaderType);

    return (
      <>
        <div className="pb-4 text-center">
          <div className="text-2xl font-semibold h-9">
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
          <div className="text-sm font-medium text-custom-text-300">a user per month</div>
        </div>
        {isLoading ? (
          <Loader className="flex flex-col items-center justify-center">
            <Loader.Item height="40px" width="14rem" />
          </Loader>
        ) : (
          <div className="flex flex-col items-center justify-center w-full">
            <button
              className={cn(
                upgradeButtonStyle,
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
              {upgradeLoaderType === planVariant ? "Redirecting to Stripe" : (upgradeCTA ?? `Upgrade to ${planeName}`)}
            </button>
            {isTrialAllowed && (
              <div className="mt-4 h-4">
                {renderTrialButton &&
                  renderTrialButton({
                    productId: product?.id,
                    priceId: price.id,
                  })}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <BasePaidPlanCard
      planVariant={planVariant}
      features={features}
      prices={CURRENT_PLAN_PRICES}
      upgradeLoaderType={upgradeLoaderType}
      verticalFeatureList={verticalFeatureList}
      extraFeatures={extraFeatures}
      renderPriceContent={renderPriceContent}
      renderActionButton={renderActionButton}
    />
  );
});
