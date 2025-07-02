"use client";

import { observer } from "mobx-react";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { Button } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";
// plane web components
import { PlanCard, SelfManagedLicenseActions } from "@/plane-web/components/license";
// plane web hooks
import { useSelfHostedSubscription, useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const SelfHostedFreePlanCard = observer(() => {
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  const { toggleLicenseActivationModal } = useSelfHostedSubscription();

  return (
    <PlanCard
      planVariant={EProductSubscriptionEnum.FREE}
      planDescription={
        <>
          <div className="text-sm font-medium text-custom-text-200">
            Your Plane license can only be used to unlock features for one workspace.
          </div>
          <div className="text-sm font-medium text-custom-text-300">
            Billable seats when you upgrade: {subscriptionDetail?.billable_members}
          </div>
          <SelfManagedLicenseActions showDeactivateButton={false} />
        </>
      }
      button={
        <>
          <Button
            variant="primary"
            size="md"
            className={cn("cursor-pointer outline-none text-xs px-4 py-1.5 rounded-lg focus:outline-none")}
            onClick={() => toggleLicenseActivationModal(true)}
          >
            Activate this workspace
          </Button>
        </>
      }
    />
  );
});
