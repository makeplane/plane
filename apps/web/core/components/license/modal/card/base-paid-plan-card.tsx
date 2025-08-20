"use client";

import { FC, ReactNode, useState } from "react";
import { observer } from "mobx-react";
import { CheckCircle } from "lucide-react";
// plane imports
import { Tabs, TabItem } from "@plane/propel/tabs";
// helpers
import { EProductSubscriptionEnum, TBillingFrequency, TSubscriptionPrice } from "@plane/types";
import { getSubscriptionBackgroundColor, getUpgradeCardVariantStyle } from "@plane/ui";
import { cn, getBaseSubscriptionName, getSubscriptionName } from "@plane/utils";

export type TBasePaidPlanCardProps = {
  planVariant: EProductSubscriptionEnum;
  features: string[];
  prices: TSubscriptionPrice[];
  upgradeLoaderType: Omit<EProductSubscriptionEnum, "FREE"> | undefined;
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
  renderPriceContent: (price: TSubscriptionPrice) => React.ReactNode;
  renderActionButton: (price: TSubscriptionPrice) => React.ReactNode;
  isSelfHosted: boolean;
};

export const BasePaidPlanCard: FC<TBasePaidPlanCardProps> = observer((props) => {
  const {
    planVariant,
    features,
    prices,
    verticalFeatureList = false,
    extraFeatures,
    renderPriceContent,
    renderActionButton,
    isSelfHosted,
  } = props;
  // states
  const [selectedPlan, setSelectedPlan] = useState<TBillingFrequency>("month");
  const basePlan = getBaseSubscriptionName(planVariant, isSelfHosted);
  const upgradeCardVariantStyle = getUpgradeCardVariantStyle(planVariant);
  // Plane details
  const planeName = getSubscriptionName(planVariant);

  // improvement: create tabs configuration map for better maintainability
  const billingFrequencyTabs: TabItem<TBillingFrequency>[] = prices.map((price: TSubscriptionPrice) => ({
    key: price.recurring,
    label: renderPriceContent(price),
    content: (
      <div className="text-center">
        <div className="text-xl font-medium">Plane {planeName}</div>
        {renderActionButton(price)}
      </div>
    ),
    onClick: () => setSelectedPlan(price.recurring),
  }));

  return (
    <div className={cn("flex flex-col py-6 px-3", upgradeCardVariantStyle)}>
      <div className="flex w-full justify-center">
        <Tabs
          tabs={billingFrequencyTabs}
          defaultTab={selectedPlan}
          // tabListContainerClassName={cn(" w-60 ", getSubscriptionBackgroundColor(planVariant, "50"))}
          // tabClassName={cn(
          //   "w-full rounded py-1 text-sm font-medium leading-5",
          //   "data-[state=active]:bg-custom-background-100 data-[state=active]:text-custom-text-100 data-[state=active]:shadow",
          //   "text-custom-text-300 hover:text-custom-text-200"
          // )}
          // tabPanelClassName="px-2 pt-6 pb-2"
          // tabClassName="p-2"
          tabListClassName={cn("w-60", getSubscriptionBackgroundColor(planVariant, "50"))}
          tabPanelClassName="px-2 pb-2"
          size="sm"
          tabClassName="py-2"
          storeInLocalStorage={false}
        />
      </div>

      {/* Features section - rendered outside tabs since it's common for all billing frequencies */}
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
                <CheckCircle className="h-4 w-4 mr-2 text-custom-text-300 flex-shrink-0" />
                <span className="text-custom-text-200 truncate">{feature}</span>
              </p>
            </li>
          ))}
        </ul>
        {extraFeatures && <div>{extraFeatures}</div>}
      </div>
    </div>
  );
});
