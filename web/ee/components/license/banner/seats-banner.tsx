"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Button } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

enum EPlanMessageKeys {
  FREE_PLAN = "free_plan",
  NEAR_LIMIT = "near_limit",
  LIMIT_REACHED = "limit_reached",
}

type TPlanMessageKeys = EPlanMessageKeys.FREE_PLAN | EPlanMessageKeys.NEAR_LIMIT | EPlanMessageKeys.LIMIT_REACHED;

const MAX_FREE_SEATS = 12;

export const LicenseSeatsBanner: FC = observer(() => {
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
    <div className="flex-shrink-0">
      <div
        className={cn(
          "relative flex justify-center items-center gap-2 p-2 px-4",
          currentVariant === "primary" ? "bg-yellow-300/15 text-yellow-500" : "bg-red-500/10 text-red-500"
        )}
      >
        <div className="text-sm font-medium text-center">{planMessages[currentPlanKey]}</div>
        <div className="flex-shrink-0">
          <Button
            variant={currentVariant === "primary" ? "primary" : "outline-danger"}
            size="sm"
            onClick={() => togglePaidPlanModal(true)}
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </div>
  );
});
