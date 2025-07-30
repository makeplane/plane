"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { CheckCircle } from "lucide-react";
import { Tab } from "@headlessui/react";
// plane imports
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

  return (
    <div className={cn("flex flex-col py-6 px-3", upgradeCardVariantStyle)}>
      <Tab.Group selectedIndex={selectedPlan === "month" ? 0 : 1}>
        <div className="flex w-full justify-center h-9">
          <Tab.List
            className={cn("flex space-x-1 rounded-md p-0.5 w-60", getSubscriptionBackgroundColor(planVariant, "50"))}
          >
            {prices.map((price: TSubscriptionPrice) => (
              <Tab
                key={price.key}
                className={({ selected }) =>
                  cn(
                    "w-full rounded py-1 text-sm font-medium leading-5",
                    selected
                      ? "bg-custom-background-100 text-custom-text-100 shadow"
                      : "text-custom-text-300 hover:text-custom-text-200"
                  )
                }
                onClick={() => setSelectedPlan(price.recurring)}
              >
                {renderPriceContent(price)}
              </Tab>
            ))}
          </Tab.List>
        </div>
        <Tab.Panels>
          {prices.map((price: TSubscriptionPrice) => (
            <Tab.Panel key={price.key}>
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
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
});
