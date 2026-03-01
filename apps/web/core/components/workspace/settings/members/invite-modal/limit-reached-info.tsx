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
import { AlertTriangleIcon } from "lucide-react";
// plane imports
import { Button, getButtonStyling } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { EProductSubscriptionEnum } from "@plane/types";

type TInvitationLimitReactInfoProps = {
  handleAddMoreSeats: () => void;
};

export const InvitationLimitReactInfo = observer(function InvitationLimitReactInfo(
  props: TInvitationLimitReactInfoProps
) {
  const { handleAddMoreSeats } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isOfflineSubscription = subscriptionDetail?.is_offline_payment;
  const isOnEnterprisePlan = subscriptionDetail?.product === EProductSubscriptionEnum.ENTERPRISE;

  if (isOnEnterprisePlan) {
    return (
      <div className="flex items-center p-3 rounded-lg bg-warning-subtle text-secondary border border-warning-subtle">
        <AlertTriangleIcon className="size-4 shrink-0 text-warning-primary mr-1.5" />
        <p className="text-caption-md-medium">No seats available. Please contact your instance admin.</p>
      </div>
    );
  }

  return (
    <div className="flex p-4 rounded-lg bg-warning-subtle text-secondary border border-warning-subtle">
      <AlertTriangleIcon className="size-4 shrink-0 text-warning-primary mr-1.5" />
      <div>
        <p className="text-caption-md-medium">You are out of seats for this workspace.</p>
        <p className="pt-1.5 text-caption-sm-regular">
          You have hit the member limit for this workspace. To add more admins and members to this workspace, please
          remove members or add more seats.
        </p>
      </div>
      <div className="flex-shirk-0 flex items-end pl-2">
        {isOfflineSubscription ? (
          <Tooltip
            tooltipContent="You have an offline subscription. Please contact support to add more seats."
            position="right"
          >
            <a href="mailto:support@plane.so" className={cn(getButtonStyling("primary", "base"))}>
              Contact support
            </a>
          </Tooltip>
        ) : (
          <Button variant="primary" onClick={handleAddMoreSeats}>
            Add more seats
          </Button>
        )}
      </div>
    </div>
  );
});
