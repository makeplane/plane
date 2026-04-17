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
import type { EProductSubscriptionEnum, IPaymentProduct, TBillingFrequency, TUpgradeParams } from "@plane/types";
import { PlansComparisonBase, shouldRenderPlanDetail } from "@/components/workspace/settings/billing/comparison/base";
// plane web imports
import type { TPlanePlans } from "@/constants/plans";
import { PLANE_PLANS } from "@/constants/plans";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// local imports
import { PlanDetail } from "./plan-detail";

type TPlansComparisonProps = {
  products: IPaymentProduct[] | undefined;
  isProductsAPILoading: boolean;
  trialLoader: EProductSubscriptionEnum | null;
  upgradeLoader: EProductSubscriptionEnum | null;
  isCompareAllFeaturesSectionOpen: boolean;
  handleTrial: (trialParams: TUpgradeParams) => void;
  handleUpgrade: (upgradeParams: TUpgradeParams) => void;
  getBillingFrequency: (subscriptionType: EProductSubscriptionEnum) => TBillingFrequency | undefined;
  setBillingFrequency: (subscriptionType: EProductSubscriptionEnum, frequency: TBillingFrequency) => void;
  setIsCompareAllFeaturesSectionOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PlansComparison = observer(function PlansComparison(props: TPlansComparisonProps) {
  const {
    products,
    isProductsAPILoading,
    trialLoader,
    upgradeLoader,
    isCompareAllFeaturesSectionOpen,
    handleTrial,
    handleUpgrade,
    getBillingFrequency,
    setBillingFrequency,
    setIsCompareAllFeaturesSectionOpen,
  } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // Derived values
  const isSelfManaged = !!subscriptionDetail?.is_self_managed;
  // plan details
  const { planDetails } = PLANE_PLANS;

  return (
    <PlansComparisonBase
      planeDetails={Object.entries(planDetails).map(([planKey, plan]) => {
        const currentPlanKey = planKey as TPlanePlans;
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
            billingFrequency={getBillingFrequency(plan.id)}
            setBillingFrequency={(frequency) => setBillingFrequency(plan.id, frequency)}
          />
        );
      })}
      isSelfManaged={isSelfManaged}
      isCompareAllFeaturesSectionOpen={isCompareAllFeaturesSectionOpen}
      setIsCompareAllFeaturesSectionOpen={setIsCompareAllFeaturesSectionOpen}
    />
  );
});
