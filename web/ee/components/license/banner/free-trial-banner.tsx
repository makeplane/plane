"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Crown, Phone } from "lucide-react";
// plane imports
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useInstance, useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const FreeTrialBanner: FC = observer(() => {
  // hooks
  const { config } = useInstance();
  const { allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE
  );

  // if the user is not a project admin then don't show the banner
  if (!canPerformWorkspaceAdminActions) return <></>;
  // validate weather to show the banner or not for the current workspace and subscription details
  if (!currentWorkspace || !subscriptionDetail || !config?.payment_server_base_url) return <></>;
  // if the trial banner is not allowed to show then don't show the banner
  if (!subscriptionDetail.show_trial_banner) return <></>;

  return (
    <div className="flex-shrink-0 w-full z-[20] bg-custom-background-100">
      <div className="bg-custom-primary-100/10 text-custom-primary-100 py-2 px-5">
        <div className="relative container mx-auto flex justify-center items-center gap-2">
          <div className="text-sm font-medium">
            Pro trial ends{" "}
            {subscriptionDetail.remaining_trial_days === 0
              ? "today"
              : `in ${subscriptionDetail.remaining_trial_days} days`}
            .
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline-primary" size="sm" className="py-1" onClick={() => togglePaidPlanModal(true)}>
              <Crown className="w-3.5 h-3.5" />
              Upgrade to Pro
            </Button>
            <a
              href="https://cal.com/plane/"
              target="_blank"
              className={cn(getButtonStyling("neutral-primary", "sm"), "py-1")}
            >
              <Phone className="w-3.5 h-3.5" />
              Get 1:1 help
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});
