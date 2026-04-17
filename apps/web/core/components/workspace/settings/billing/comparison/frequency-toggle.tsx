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

// plane imports
import { observer } from "mobx-react";
import type { TBillingFrequency } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
import { Loader } from "@plane/ui";
import type { TSubscriptionPriceDetail } from "@plane/utils";
import { calculateYearlyDiscount, cn } from "@plane/utils";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TPlanFrequencyToggleProps = {
  subscriptionType: EProductSubscriptionEnum;
  isProductsAPILoading: boolean;
  selectedFrequency: TBillingFrequency;
  subscriptionPriceDetails: TSubscriptionPriceDetail;
  setSelectedFrequency: (frequency: TBillingFrequency) => void;
};

export const PlanFrequencyToggle = observer(function PlanFrequencyToggle(props: TPlanFrequencyToggleProps) {
  const { isProductsAPILoading, selectedFrequency, subscriptionPriceDetails, setSelectedFrequency } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const currentSubscription = subscriptionDetail?.product;
  const showPaymentButton = subscriptionDetail?.show_payment_button;
  const { monthlyPriceDetails, yearlyPriceDetails } = subscriptionPriceDetails;
  const yearlyDiscount =
    monthlyPriceDetails.price && yearlyPriceDetails.price
      ? calculateYearlyDiscount(monthlyPriceDetails.price, yearlyPriceDetails.price)
      : 0;

  if (!showPaymentButton && currentSubscription !== EProductSubscriptionEnum.ONE) return null;

  if (!subscriptionDetail || isProductsAPILoading) {
    return (
      <Loader className="w-full h-full">
        <Loader.Item height="32px" width="100%" />
      </Loader>
    );
  }

  return (
    <div className="flex w-full items-center cursor-pointer py-1">
      <div className="flex space-x-1 rounded-md bg-layer-3 p-0.5 w-full">
        <button
          type="button"
          key="month"
          onClick={() => setSelectedFrequency("month")}
          className={cn(
            "w-full rounded-sm px-1 py-0.5 text-caption-sm-medium leading-5 text-center",
            selectedFrequency === "month"
              ? "bg-layer-2 text-primary shadow-raised-100 border border-subtle-1"
              : "text-tertiary hover:text-secondary"
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          key="year"
          onClick={() => setSelectedFrequency("year")}
          className={cn(
            "w-full rounded-sm px-1 py-0.5 text-caption-sm-medium leading-5 text-center",
            selectedFrequency === "year"
              ? "bg-layer-2 text-primary shadow-raised-100 border border-subtle-1"
              : "text-tertiary hover:text-secondary"
          )}
        >
          Yearly
          {yearlyDiscount > 0 && (
            <span className="bg-accent-primary text-on-color rounded-full px-1 py-0.5 ml-1.5 text-caption-xs-regular">
              -{yearlyDiscount}%
            </span>
          )}
        </button>
      </div>
    </div>
  );
});
