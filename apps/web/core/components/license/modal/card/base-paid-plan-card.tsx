/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
    <div className="flex flex-col rounded-xl border border-subtle bg-layer-2 px-3 py-6">
      <Tab.Group selectedIndex={selectedPlan === "month" ? 0 : 1}>
        <div className="flex h-9 w-full justify-center">
          <Tab.List className="flex w-60 space-x-1 rounded-md bg-layer-3 p-0.5">
            {prices.map((price: TSubscriptionPrice) => (
              <Tab
                key={price.key}
                className={({ selected }) =>
                  cn(
                    "w-full rounded-sm py-1 text-caption-md-medium leading-5",
                    selected
                      ? "border border-subtle-1 bg-layer-2 text-primary shadow-raised-100"
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
                      className={cn("relative col-span-12 flex rounded-md p-2", {
                        "sm:col-span-6": !verticalFeatureList,
                      })}
                    >
                      <p className="line-clamp-1 flex w-full items-center text-caption-md-medium leading-5">
                        <CheckCircle className="mr-2 size-4 flex-shrink-0 text-tertiary" />
                        <span className="truncate text-secondary">{feature}</span>
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
