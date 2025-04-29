"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Loader as LoaderIcon } from "lucide-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { Button, getButtonStyling, Loader } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// helpers
import { getUpgradeButtonStyle } from "@/components/workspace/billing/subscription";
// plane web components
import { PlanCard } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TCloudFreePlanCardProps = {
  upgradeProductType: EProductSubscriptionEnum;
  isProductsAPILoading: boolean;
  trialLoader: EProductSubscriptionEnum | null;
  upgradeLoader: EProductSubscriptionEnum | null;
  handleTrial: (selectedSubscriptionType: EProductSubscriptionEnum) => void;
  handleUpgrade: (selectedSubscriptionType: EProductSubscriptionEnum) => void;
};

export const CloudFreePlanCard: FC<TCloudFreePlanCardProps> = observer((props: TCloudFreePlanCardProps) => {
  const { upgradeProductType, isProductsAPILoading, trialLoader, upgradeLoader, handleTrial, handleUpgrade } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const upgradeProductName = getSubscriptionName(upgradeProductType);
  const upgradeButtonStyle =
    getUpgradeButtonStyle(upgradeProductType, !!upgradeLoader) ?? getButtonStyling("primary", "lg", !!upgradeLoader);

  return (
    <PlanCard
      planVariant={EProductSubscriptionEnum.FREE}
      planDescription={
        <>
          <div className="text-sm font-medium text-custom-text-200">
            12 members, unlimited projects, work items, cycles, modules, and pages
          </div>
          <div className="text-sm font-medium text-custom-text-300">
            Billable seats when you upgrade: {subscriptionDetail?.billable_members}
          </div>
        </>
      }
      button={
        <div className="flex items-center justify-center gap-2">
          {isProductsAPILoading ? (
            <Loader className="w-32">
              <Loader.Item height="30px" width="100%" />
            </Loader>
          ) : (
            <button
              className={cn(
                upgradeButtonStyle,
                "relative inline-flex items-center justify-center w-fit px-4 py-1 text-xs font-medium rounded-lg focus:outline-none"
              )}
              tabIndex={-1}
              onClick={() => handleUpgrade(upgradeProductType)}
              disabled={!!upgradeLoader}
            >
              {upgradeLoader === upgradeProductType ? "Redirecting to Stripe..." : `Upgrade to ${upgradeProductName}`}
            </button>
          )}
          {subscriptionDetail?.is_trial_ended && (
            <div className="px-2 text-center text-xs text-red-500 font-medium">Pro trial ended</div>
          )}
          {subscriptionDetail?.is_trial_allowed && (
            <>
              {isProductsAPILoading ? (
                <Loader className="w-28">
                  <Loader.Item height="30px" width="100%" />
                </Loader>
              ) : (
                <>
                  <Button
                    variant="link-neutral"
                    size="sm"
                    onClick={() => handleTrial(upgradeProductType)}
                    className="w-28"
                    disabled={!!trialLoader}
                  >
                    <div className="w-3 h-3">
                      {trialLoader === upgradeProductType && <LoaderIcon size={12} className="animate-spin" />}
                    </div>
                    <span>Start free trial</span>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      }
    />
  );
});
