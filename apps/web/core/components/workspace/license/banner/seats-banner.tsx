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
import { Button } from "@plane/propel/button";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

enum EPlanMessageKeys {
  FREE_PLAN = "free_plan",
  NEAR_LIMIT = "near_limit",
  LIMIT_REACHED = "limit_reached",
}

type TPlanMessageKeys = EPlanMessageKeys.FREE_PLAN | EPlanMessageKeys.NEAR_LIMIT | EPlanMessageKeys.LIMIT_REACHED;

const MAX_FREE_SEATS = 12;

export const LicenseSeatsBanner = observer(function LicenseSeatsBanner() {
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const showBanner = subscriptionDetail?.show_seats_banner;
  const totalSeats = subscriptionDetail?.occupied_seats ?? 1;
  const freeSeats = subscriptionDetail?.free_seats ?? 1;

  if (!currentWorkspace || !subscriptionDetail || !showBanner) return <></>;

  const currentPlanKey: TPlanMessageKeys =
    freeSeats > MAX_FREE_SEATS
      ? EPlanMessageKeys.FREE_PLAN
      : totalSeats >= MAX_FREE_SEATS
        ? EPlanMessageKeys.LIMIT_REACHED
        : EPlanMessageKeys.NEAR_LIMIT;

  const planMessages = {
    free_plan: `Your workspace has been grandfathered to ${freeSeats} over the 12-user limit on the Free plan. To add more users, upgrade to a paid plan.`,
    near_limit: `You have ${totalSeats} out of ${freeSeats} users allowed on the Free plan. To remove the limit, upgrade to a paid plan.`,
    limit_reached: `You have ${totalSeats} out of ${freeSeats} users allowed on the Free plan. To remove the limit, upgrade to a paid plan.`,
  };
  const currentVariant: "primary" | "danger" =
    currentPlanKey && [EPlanMessageKeys.NEAR_LIMIT, EPlanMessageKeys.LIMIT_REACHED].includes(currentPlanKey)
      ? "danger"
      : "primary";

  return (
    <div className="shrink-0">
      <div
        className={cn(
          "relative flex justify-center items-center gap-2 p-2 px-4",
          currentVariant === "primary" ? "bg-yellow-300/15 text-yellow-500" : "bg-danger-subtle text-danger-primary"
        )}
      >
        <div className="text-13 font-medium text-center">{planMessages[currentPlanKey]}</div>
        <div className="shrink-0">
          <Button
            variant={currentVariant === "primary" ? "primary" : "error-outline"}
            onClick={() => togglePaidPlanModal(true)}
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </div>
  );
});
