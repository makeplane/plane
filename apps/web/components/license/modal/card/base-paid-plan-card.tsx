/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
// plane imports
import { Tabs, TabsList, TabsPanel } from "@makeplane/propel/components/tabs";
import { Tab as TabElement } from "@makeplane/propel/elements/tabs";
import { TickCircleOutline } from "@makeplane/propel/icons";
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
      <Tabs
        variant="contained"
        stretch="full"
        value={selectedPlan}
        onValueChange={(value: TBillingFrequency) => setSelectedPlan(value)}
      >
        <div className="flex h-9 w-full justify-center">
          <div className="w-60">
            <TabsList>
              {prices.map((price: TSubscriptionPrice) => (
                // propel: the price label is a ReactNode (e.g. a discount pill), which the ready-made `Tab`
                // (string `label`) cannot hold, so the styled tab element is grafted onto Base UI's tab.
                <BaseTabs.Tab
                  key={price.key}
                  value={price.recurring}
                  render={<TabElement variant="contained" stretch="full" />}
                >
                  {renderPriceContent(price)}
                </BaseTabs.Tab>
              ))}
            </TabsList>
          </div>
        </div>
        {prices.map((price: TSubscriptionPrice) => (
          <TabsPanel key={price.key} value={price.recurring}>
            <div className="pt-3 text-center">
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
                      <TickCircleOutline className="mr-2 size-4 flex-shrink-0 text-tertiary" />
                      <span className="truncate text-secondary">{feature}</span>
                    </p>
                  </li>
                ))}
              </ul>
              {extraFeatures && <div>{extraFeatures}</div>}
            </div>
          </TabsPanel>
        ))}
      </Tabs>
    </div>
  );
});
