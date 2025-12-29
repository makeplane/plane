import { useState } from "react";
import { observer } from "mobx-react";
import { CheckCircle } from "lucide-react";
import { Tab } from "@headlessui/react";
// plane imports
// helpers
import type { EProductSubscriptionEnum, TBillingFrequency, TSubscriptionPrice } from "@plane/types";
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
  // Plane details
  const planeName = getSubscriptionName(planVariant);

  return (
    <div className="flex flex-col py-6 px-3 bg-layer-2 rounded-xl border border-subtle">
      <Tab.Group selectedIndex={selectedPlan === "month" ? 0 : 1}>
        <div className="flex w-full justify-center h-9">
          <Tab.List className="flex space-x-1 rounded-md p-0.5 w-60 bg-layer-3">
            {prices.map((price: TSubscriptionPrice) => (
              <Tab
                key={price.key}
                className={({ selected }) =>
                  cn(
                    "w-full rounded-sm py-1 text-caption-md-medium leading-5",
                    selected
                      ? "bg-layer-2 text-primary shadow-raised-100 border border-subtle-1"
                      : "text-tertiary hover:text-secondary"
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
                <div className="text-h4-medium">Plane {planeName}</div>
                {renderActionButton(price)}
              </div>
              <div className="px-2 pt-6 pb-2">
                <div className="p-2 text-caption-md-semibold">{`Everything in ${basePlan} +`}</div>
                <ul className="grid grid-cols-12 gap-x-4">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className={cn("col-span-12 relative rounded-md p-2 flex", {
                        "sm:col-span-6": !verticalFeatureList,
                      })}
                    >
                      <p className="w-full text-caption-md-medium leading-5 flex items-center line-clamp-1">
                        <CheckCircle className="size-4 mr-2 text-tertiary flex-shrink-0" />
                        <span className="text-secondary truncate">{feature}</span>
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
