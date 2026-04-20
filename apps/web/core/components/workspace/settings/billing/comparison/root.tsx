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
import { SUBSCRIPTION_WITH_BILLING_FREQUENCY } from "@plane/constants";
import type { EProductSubscriptionEnum, IPaymentProduct, TBillingFrequency, TUpgradeParams } from "@plane/types";
import { shouldRenderPlanDetail } from "@plane/utils";
// components
import { PlansComparisonBase } from "@/components/workspace/settings/billing/comparison/base";
//
import { PLANE_PLANS } from "@/constants/plans";
// local imports
import { PlanDetail } from "./plan-detail";

type TPlansComparisonProps = {
  products: IPaymentProduct[] | undefined;
  isProductsAPILoading: boolean;
  trialLoader: EProductSubscriptionEnum | null;
  upgradeLoader: EProductSubscriptionEnum | null;
  handleTrial: (trialParams: TUpgradeParams) => void;
  handleUpgrade: (upgradeParams: TUpgradeParams) => void;
  selectedFrequency: TBillingFrequency;
  showHeadColumn: boolean;
};

export const PlansComparison = function PlansComparison(props: TPlansComparisonProps) {
  const {
    products,
    isProductsAPILoading,
    trialLoader,
    upgradeLoader,
    handleTrial,
    handleUpgrade,
    selectedFrequency,
    showHeadColumn,
  } = props;

  // plan details
  const { planDetails } = PLANE_PLANS;

  return (
    <PlansComparisonBase
      showHeadColumn={showHeadColumn}
      planeDetails={Object.entries(planDetails).map(([planKey, plan]) => {
        const currentPlanKey = plan.id;
        if (!shouldRenderPlanDetail(currentPlanKey)) return null;
        return (
          <PlanDetail
            key={planKey}
            subscriptionType={plan.id}
            planDetail={plan}
            products={products}
            isProductsAPILoading={isProductsAPILoading}
            trialLoader={trialLoader}
            upgradeLoader={upgradeLoader}
            handleUpgrade={handleUpgrade}
            handleTrial={handleTrial}
            billingFrequency={SUBSCRIPTION_WITH_BILLING_FREQUENCY.includes(plan.id) ? selectedFrequency : undefined}
          />
        );
      })}
    />
  );
};
