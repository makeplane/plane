"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useInstance, useMember, useWorkspace } from "@/hooks/store";
// plane web components
import { CloudUpgradeModal } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

enum EPlanMessageKeys {
  FREE_PLAN = "free_plan",
  NEAR_LIMIT = "near_limit",
  LIMIT_REACHED = "limit_reached",
}
type TPlanMessageKeys =
  | EPlanMessageKeys.FREE_PLAN
  | EPlanMessageKeys.NEAR_LIMIT
  | EPlanMessageKeys.LIMIT_REACHED
  | undefined;
const BANNER_LIMIT = 8;
const MAX_FREE_SEATS = 12;

export const LicenseSeatsBanner: FC = observer(() => {
  // hooks
  const { config } = useInstance();
  const { currentWorkspace } = useWorkspace();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  const {
    workspace: { workspaceMemberIds, workspaceMemberInvitationIds },
  } = useMember();
  // states
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  if (!currentWorkspace || !subscriptionDetail || !config) return <></>;

  // derived values
  const totalMembersCount = (workspaceMemberIds?.length ?? 0) + (workspaceMemberInvitationIds?.length ?? 0);
  const isSelfManaged = subscriptionDetail.is_self_managed ?? false;
  const isFreeProduct = subscriptionDetail.product === "FREE";
  const canBannerShown = (isFreeProduct || subscriptionDetail?.is_on_trial) ?? false;
  const freeSeats = subscriptionDetail.free_seats ?? 0;

  if (!currentWorkspace || !subscriptionDetail || !config || isSelfManaged) return <></>;
  if (!canBannerShown) return <></>;

  const currentPlanKey: TPlanMessageKeys =
    freeSeats > MAX_FREE_SEATS
      ? EPlanMessageKeys.FREE_PLAN
      : totalMembersCount >= BANNER_LIMIT
        ? EPlanMessageKeys.NEAR_LIMIT
        : totalMembersCount > BANNER_LIMIT && totalMembersCount === MAX_FREE_SEATS
          ? EPlanMessageKeys.LIMIT_REACHED
          : undefined;

  if (!currentPlanKey) return <></>;

  const planMessages = {
    free_plan: `Your workspace has been grandfathered to ${freeSeats} over the 12-member limit on the Free plan. To add more members, upgrade to Pro.`,
    near_limit: `You’ve already ${totalMembersCount} out of ${freeSeats} members allowed on the Free plan. You can only add ${freeSeats - totalMembersCount} more members. To remove the limit, upgrade to Pro.`,
    limit_reached:
      totalMembersCount > freeSeats
        ? `You’ve reached the members limit on this plan. To add more members, upgrade to Pro`
        : `You’ve reached the members limit of ${freeSeats} on this plan. To add more members, upgrade to Pro`,
  };
  const currentVariant: "primary" | "danger" =
    currentPlanKey && [EPlanMessageKeys.NEAR_LIMIT, EPlanMessageKeys.LIMIT_REACHED].includes(currentPlanKey)
      ? "danger"
      : "primary";

  return (
    <>
      <CloudUpgradeModal isOpen={pricingModalOpen} handleClose={() => setPricingModalOpen(false)} />
      <div
        className={cn(
          "relative flex justify-center items-center gap-2 p-2 px-4",
          currentVariant === "primary" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}
      >
        <div className="text-sm font-medium text-center">{planMessages[currentPlanKey]}</div>
        <div className="flex-shrink-0">
          <Button
            variant={currentVariant === "primary" ? "primary" : "outline-danger"}
            size="sm"
            onClick={() => setPricingModalOpen(true)}
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </>
  );
});
