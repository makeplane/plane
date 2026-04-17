/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { CheckCircle } from "lucide-react";
// plane imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@plane/propel/tabs";
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
    <div className="flex flex-col py-6 px-3 bg-layer-1 rounded-xl">
      <Tabs value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as TBillingFrequency)}>
        <div className="flex w-full justify-center">
          <TabsList>
            {prices.map((price: TSubscriptionPrice) => (
              <TabsTrigger key={price.key} value={price.recurring}>
                {renderPriceContent(price)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div>
          {prices.map((price: TSubscriptionPrice) => (
            <TabsContent key={price.key} value={price.recurring}>
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
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
});
