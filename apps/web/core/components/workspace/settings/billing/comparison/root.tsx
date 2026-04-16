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

import { observer } from "mobx-react";
// plane imports
import { SUBSCRIPTION_WITH_BILLING_FREQUENCY } from "@plane/constants";
import type { EProductSubscriptionEnum, IPaymentProduct, TBillingFrequency, TUpgradeParams } from "@plane/types";
// components
import { PlansComparisonBase } from "@/components/workspace/settings/billing/comparison/base";
// constants
import { getUpgradePlans, PLANE_PLANS } from "@/constants/plans";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
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

export const PlansComparison = observer(function PlansComparison(props: TPlansComparisonProps) {
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
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const currentPlan = subscriptionDetail?.product;
  const upgradePlans = getUpgradePlans(currentPlan);
  const isHorizontalView = upgradePlans.length === 1;

  const { planDetails } = PLANE_PLANS;

  return (
    <PlansComparisonBase
      upgradePlans={upgradePlans}
      isHorizontalView={isHorizontalView}
      showHeadColumn={showHeadColumn}
      planeDetails={upgradePlans.map((planId) => (
        <PlanDetail
          key={planId}
          subscriptionType={planId}
          planDetail={planDetails[planId]}
          products={products}
          isProductsAPILoading={isProductsAPILoading}
          trialLoader={trialLoader}
          upgradeLoader={upgradeLoader}
          handleUpgrade={handleUpgrade}
          handleTrial={handleTrial}
          billingFrequency={SUBSCRIPTION_WITH_BILLING_FREQUENCY.includes(planId) ? selectedFrequency : undefined}
          isHorizontalView={isHorizontalView}
        />
      ))}
    />
  );
});
