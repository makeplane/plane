import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { CheckCircle } from "lucide-react";
// plane imports
import { Tabs } from "@plane/propel/tabs";
// helpers
import type { EProductSubscriptionEnum, TBillingFrequency, TSubscriptionPrice } from "@plane/types";
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
};

export const BasePaidPlanCard = observer(function BasePaidPlanCard(props: TBasePaidPlanCardProps) {
  const {
    planVariant,
    features,
    prices,
    verticalFeatureList = false,
    extraFeatures,
    renderPriceContent,
    renderActionButton,
  } = props;
  // states
  const [selectedPlan, setSelectedPlan] = useState<TBillingFrequency>("month");
  const basePlan = getBaseSubscriptionName(planVariant);
  const upgradeCardVariantStyle = getUpgradeCardVariantStyle(planVariant);
  // Plane details
  const planeName = getSubscriptionName(planVariant);

  return (
    <div className={cn("flex flex-col py-6 px-3", upgradeCardVariantStyle)}>
      <Tabs value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as TBillingFrequency)}>
        <div className="flex w-full justify-center">
          <Tabs.List className={cn("flex rounded-md w-60", getSubscriptionBackgroundColor(planVariant, "50"))}>
            {prices.map((price: TSubscriptionPrice) => (
              <Tabs.Trigger
                key={price.key}
                value={price.recurring}
                className={cn(
                  "w-full rounded  text-sm font-medium leading-5 py-2",
                  "data-[selected]:bg-custom-background-100 data-[selected]:text-custom-text-100 data-[selected]:shadow",
                  "text-custom-text-300 hover:text-custom-text-200"
                )}
              >
                {renderPriceContent(price)}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>
        <div>
          {prices.map((price: TSubscriptionPrice) => (
            <Tabs.Content key={price.key} value={price.recurring}>
              <div className="pt-6 text-center">
                <div className="text-xl font-medium">Plane {planeName}</div>
                {renderActionButton(price)}
              </div>
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
            </Tabs.Content>
          ))}
        </div>
      </Tabs>
    </div>
  );
});
