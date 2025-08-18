"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { getButtonStyling, getSubscriptionBackgroundColor, getUpgradeButtonStyle } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// hooks
import { useInstance } from "@/hooks/store/use-instance"
import { useUserPermissions } from "@/hooks/store/user"
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

const COMMON_BUTTON_STYLE =
  "flex flex-shrink-0 items-center justify-center py-1 px-2 w-fit text-xs font-medium rounded focus:outline-none transition-all duration-300 animate-slide-up";

export const TrialBanner: FC = observer(() => {
  // hooks
  const { config } = useInstance();
  const { allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const currentPlan = subscriptionDetail?.product;
  const subscriptionName = currentPlan && getSubscriptionName(currentPlan);
  const canPerformWorkspaceAdminActions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE
  );

  // if the user is not a project admin then don't show the banner
  if (!canPerformWorkspaceAdminActions) return <></>;
  // validate weather to show the banner or not for the current workspace and subscription details
  if (!currentWorkspace || !subscriptionDetail || !subscriptionName || !config?.payment_server_base_url) return <></>;
  // if the trial banner is not allowed to show then don't show the banner
  if (!subscriptionDetail.show_trial_banner) return <></>;

  return (
    <div className="flex-shrink-0 w-full z-[20] bg-custom-background-100">
      <div className={cn("text-custom-text-200 py-3 px-5", getSubscriptionBackgroundColor(currentPlan, "50"))}>
        <div className="relative container mx-auto flex justify-center items-center gap-4">
          <div className="text-sm font-medium">
            {subscriptionName} trial ends{" "}
            {subscriptionDetail.remaining_trial_days === 0
              ? "today"
              : `in ${subscriptionDetail.remaining_trial_days} days`}
            .
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              className={cn(getUpgradeButtonStyle(currentPlan, false), COMMON_BUTTON_STYLE, "bg-transparent")}
              onClick={() => togglePaidPlanModal(true)}
            >
              Upgrade to {subscriptionName}
            </button>
            <a
              href="https://cal.com/plane/"
              target="_blank"
              className={cn(getButtonStyling("neutral-primary", "sm"), COMMON_BUTTON_STYLE, "border-custom-border-400")}
            >
              Get 1:1 help
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});
