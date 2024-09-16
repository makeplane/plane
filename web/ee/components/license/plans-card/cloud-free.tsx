"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Loader as LoaderIcon } from "lucide-react";
// ui
import { Button, Loader } from "@plane/ui";
// plane web components
import { PlanCard } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TCloudFreePlanCardProps = {
  isProductsAPILoading: boolean;
  trialLoader: boolean;
  upgradeLoader: boolean;
  handleTrial: () => void;
  handleUpgrade: () => void;
};

export const CloudFreePlanCard: FC<TCloudFreePlanCardProps> = observer((props: TCloudFreePlanCardProps) => {
  const { isProductsAPILoading, trialLoader, upgradeLoader, handleTrial, handleUpgrade } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

  return (
    <PlanCard
      planName="Free"
      planDescription={
        <>
          <div className="text-sm font-medium text-custom-text-200">
            12 members, unlimited projects, issues, cycles, modules, and pages
          </div>
        </>
      }
      button={
        <div className="flex items-center justify-center gap-2">
          <Button
            tabIndex={-1}
            variant="primary"
            className="w-fit cursor-pointer px-4 py-1.5 text-center text-sm font-medium outline-none"
            onClick={handleUpgrade}
            disabled={upgradeLoader}
          >
            {upgradeLoader ? "Redirecting to Stripe..." : "Upgrade to Pro"}
          </Button>
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
                  <Button variant="link-neutral" size="sm" onClick={handleTrial} className="w-28">
                    <span>Start free trial</span>
                    <div className="w-3 h-3">{trialLoader && <LoaderIcon size={12} className="animate-spin" />}</div>
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
