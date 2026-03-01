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
import { EUserPermissionsLevel, SUBSCRIPTION_WEBPAGE_URLS } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/propel/button";
import { EUserWorkspaceRoles } from "@plane/types";
import { cn, getSubscriptionName } from "@plane/utils";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const TrialBanner = observer(function TrialBanner() {
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
    <div className="flex-shrink-0 w-full z-[20] bg-surface-1">
      <div className={cn("bg-plans-brand-subtle text-plans-brand-primary py-3 px-5")}>
        <div className="relative container mx-auto flex justify-center items-center gap-4">
          <div className="text-13 font-medium">
            {subscriptionName} trial ends{" "}
            {subscriptionDetail.remaining_trial_days === 0
              ? "today"
              : `in ${subscriptionDetail.remaining_trial_days} days`}
            .
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Button variant="primary" onClick={() => togglePaidPlanModal(true)}>
              Upgrade to {subscriptionName}
            </Button>
            <a
              href={SUBSCRIPTION_WEBPAGE_URLS[currentPlan]}
              target="_blank"
              className={getButtonStyling("secondary", "base")}
              rel="noreferrer"
            >
              Learn more
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});
