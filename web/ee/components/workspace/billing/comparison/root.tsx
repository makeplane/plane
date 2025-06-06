import { observer } from "mobx-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { IPaymentProduct, TBillingFrequency, TUpgradeParams } from "@plane/types";
import { PlansComparisonBase, shouldRenderPlanDetail } from "@/components/workspace/billing/comparison/base";
// plane web imports
import { PLANE_PLANS, TPlanePlans } from "@/constants/plans";
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

export const PlansComparison = observer((props: TPlansComparisonProps) => {
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
