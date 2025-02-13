"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { CheckCircle } from "lucide-react";
import { Tab } from "@headlessui/react";
// types
import { TProductSubscriptionType } from "@plane/types";
// helpers
import { getBasePlanName } from "@plane/utils";
import { cn } from "@/helpers/common.helper";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export type TPriceFrequency = "month" | "year";

export type TCurrentPlanPrice = {
  key: string;
  id: string | undefined;
  currency: string;
  price: number;
  recurring: TPriceFrequency;
};

export type TBasePaidPlanCardProps = {
  planVariant: TProductSubscriptionType;
  features: string[];
  prices: TCurrentPlanPrice[];
  upgradeLoaderType: Omit<TProductSubscriptionType, "FREE"> | undefined;
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
  renderPriceContent: (price: TCurrentPlanPrice) => React.ReactNode;
  renderActionButton: (price: TCurrentPlanPrice) => React.ReactNode;
};

export const getDiscountPillStyle = (planVariant: TProductSubscriptionType): string => {
  switch (planVariant) {
    case "PRO":
      return "bg-gradient-to-r from-[#C78401] to-[#896828] text-white";
    case "BUSINESS":
      return "bg-gradient-to-r from-[#7C99D0] to-[#31426C] text-white";
    default:
      return "bg-custom-primary-300 text-white";
  }
};

export const getUpgradeButtonStyle = (
  planVariant: TProductSubscriptionType,
  isDisabled: boolean
): string | undefined => {
  switch (planVariant) {
    case "PRO":
      return cn("text-white bg-gradient-to-r from-[#C78401] to-[#896828]", {
        "opacity-70 cursor-not-allowed": isDisabled,
      });
    case "BUSINESS":
      return cn("text-white bg-gradient-to-r from-[#7C99D0] to-[#31426C]", {
        "opacity-70 cursor-not-allowed": isDisabled,
      });
    default:
      return undefined;
  }
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
  } = props;
  // states
  const [selectedPlan, setSelectedPlan] = useState<TPriceFrequency>("month");
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isSelfHosted = !!subscriptionDetail?.is_self_managed;
  const basePlan = getBasePlanName(planVariant, isSelfHosted);
  // Plane details
  const planeName = planVariant.charAt(0).toUpperCase() + planVariant.slice(1).toLowerCase();

  return (
    <div className="flex flex-col py-4 px-2 border border-custom-primary-200/30 rounded-xl bg-custom-primary-200/5">
      <Tab.Group selectedIndex={selectedPlan === "month" ? 0 : 1}>
        <div className="flex w-full justify-center h-9">
          <Tab.List className="flex space-x-1 rounded-md bg-custom-primary-200/10 p-1 w-60">
            {prices.map((price: TCurrentPlanPrice) => (
              <Tab
                key={price.key}
                className={({ selected }) =>
                  cn(
                    "w-full rounded py-1 text-sm font-medium leading-5",
                    selected
                      ? "bg-custom-background-100 text-custom-primary-300 shadow"
                      : "hover:bg-custom-primary-100/5 text-custom-text-300 hover:text-custom-text-200"
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
          {prices.map((price: TCurrentPlanPrice) => (
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
});
