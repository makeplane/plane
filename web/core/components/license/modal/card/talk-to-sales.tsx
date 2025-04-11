"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// types
import { EProductSubscriptionEnum } from "@plane/constants";
// plane imports
import { TSubscriptionPrice } from "@plane/types";
import { getButtonStyling, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { getUpgradeButtonStyle } from "@/components/workspace/billing/subscription";
// local imports
import { BasePaidPlanCard } from "./base-paid-plan-card";

export type TalkToSalesCardProps = {
  planVariant: EProductSubscriptionEnum;
  href: string;
  isLoading?: boolean;
  features: string[];
  prices: TSubscriptionPrice[];
  upgradeLoaderType: Omit<EProductSubscriptionEnum, "FREE"> | undefined;
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
  isSelfHosted: boolean;
  isTrialAllowed: boolean;
};

export const TalkToSalesCard: FC<TalkToSalesCardProps> = observer((props) => {
  const {
    planVariant,
    href,
    features,
    prices,
    isLoading,
    verticalFeatureList = false,
    extraFeatures,
    upgradeLoaderType,
    isSelfHosted,
    isTrialAllowed,
  } = props;

  const renderPriceContent = (price: TSubscriptionPrice) => (
    <>
      {price.recurring === "month" && "Monthly"}
      {price.recurring === "year" && "Yearly"}
    </>
  );

  const renderActionButton = () => {
    const upgradeButtonStyle =
      getUpgradeButtonStyle(planVariant, !!upgradeLoaderType) ?? getButtonStyling("primary", "lg", !!upgradeLoaderType);

    return (
      <>
        <div className="pb-4 text-center">
          <div className="text-2xl font-semibold h-9 flex justify-center items-center">
            {isLoading ? (
              <Loader className="flex flex-col items-center justify-center">
                <Loader.Item height="36px" width="4rem" />
              </Loader>
            ) : (
              <>Quote on request</>
            )}
          </div>
          <div className="text-sm font-medium text-custom-text-300">per user per month</div>
        </div>
        {isLoading ? (
          <Loader className="flex flex-col items-center justify-center">
            <Loader.Item height="38px" width="14rem" />
          </Loader>
        ) : (
          <div className="flex flex-col items-center justify-center w-full">
            <a
              href={href}
              target="_blank"
              className={cn(
                upgradeButtonStyle,
                "relative inline-flex items-center justify-center w-56 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none"
              )}
            >
              Talk to Sales
            </a>
            {isTrialAllowed && !isSelfHosted && <div className="mt-4 h-4" />}
          </div>
        )}
      </>
    );
  };

  return (
    <BasePaidPlanCard
      planVariant={planVariant}
      features={features}
      prices={prices}
      upgradeLoaderType={upgradeLoaderType}
      verticalFeatureList={verticalFeatureList}
      extraFeatures={extraFeatures}
      renderPriceContent={renderPriceContent}
      renderActionButton={renderActionButton}
      isSelfHosted={isSelfHosted}
    />
  );
});
