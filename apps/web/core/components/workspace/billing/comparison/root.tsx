/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { EProductSubscriptionEnum, TBillingFrequency } from "@plane/types";
// components
import { PlansComparisonBase, shouldRenderPlanDetail } from "@/components/workspace/billing/comparison/base";
import type { TPlanePlans } from "@/components/workspace/billing/comparison/plans";
import { PLANE_PLANS } from "@/components/workspace/billing/comparison/plans";
import { useSelfHostedPolicy } from "@/hooks/store/use-self-hosted-policy";
// plane web imports
import { PlanDetail } from "./plan-detail";

type TPlansComparisonProps = {
  isCompareAllFeaturesSectionOpen: boolean;
  getBillingFrequency: (subscriptionType: EProductSubscriptionEnum) => TBillingFrequency | undefined;
  setBillingFrequency: (subscriptionType: EProductSubscriptionEnum, frequency: TBillingFrequency) => void;
  setIsCompareAllFeaturesSectionOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PlansComparison = observer(function PlansComparison(props: TPlansComparisonProps) {
  const {
    isCompareAllFeaturesSectionOpen,
    getBillingFrequency,
    setBillingFrequency,
    setIsCompareAllFeaturesSectionOpen,
  } = props;
  // plan details
  const { planDetails } = PLANE_PLANS;

  const { hasCommercialGating } = useSelfHostedPolicy();
  // Purchase CTAs stay hosted-only. Self-hosted Community reports
  // ``commercial_gating: false`` from ``capabilities.policy``.
  const isSelfManaged = !hasCommercialGating;

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
            billingFrequency={getBillingFrequency(plan.id)}
            setBillingFrequency={(frequency) => setBillingFrequency(plan.id, frequency)}
            isSelfManaged={isSelfManaged}
          />
        );
      })}
      isSelfManaged={isSelfManaged}
      isCompareAllFeaturesSectionOpen={isCompareAllFeaturesSectionOpen}
      setIsCompareAllFeaturesSectionOpen={setIsCompareAllFeaturesSectionOpen}
    />
  );
});
