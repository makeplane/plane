import { observer } from "mobx-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { TBillingFrequency } from "@plane/types";
// components
import { PlansComparisonBase, shouldRenderPlanDetail } from "@/components/workspace/billing/comparison/base";
import { PLANE_PLANS, TPlanePlans } from "@/constants/plans";
// plane web imports
import { PlanDetail } from "./plan-detail";

type TPlansComparisonProps = {
  isCompareAllFeaturesSectionOpen: boolean;
  getBillingFrequency: (subscriptionType: EProductSubscriptionEnum) => TBillingFrequency | undefined;
  setBillingFrequency: (subscriptionType: EProductSubscriptionEnum, frequency: TBillingFrequency) => void;
  setIsCompareAllFeaturesSectionOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PlansComparison = observer((props: TPlansComparisonProps) => {
  const {
    isCompareAllFeaturesSectionOpen,
    getBillingFrequency,
    setBillingFrequency,
    setIsCompareAllFeaturesSectionOpen,
  } = props;
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
            billingFrequency={getBillingFrequency(plan.id)}
            setBillingFrequency={(frequency) => setBillingFrequency(plan.id, frequency)}
          />
        );
      })}
      isSelfManaged
      isCompareAllFeaturesSectionOpen={isCompareAllFeaturesSectionOpen}
      setIsCompareAllFeaturesSectionOpen={setIsCompareAllFeaturesSectionOpen}
    />
  );
});
