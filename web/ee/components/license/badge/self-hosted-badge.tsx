"use client";

import { observer } from "mobx-react";
import Image from "next/image";
// ui
import { Button } from "@plane/ui";
// plane web components
import { PaidPlanUpgradeModal } from "@/ce/components/workspace/upgrade";
import { PlaneOneEditionBadge } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";

export const SelfHostedEditionBadge = observer(() => {
  // hooks
  const {
    isPaidPlanModalOpen,
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    togglePaidPlanModal,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();

  if (!subscriptionDetail || subscriptionDetail.product === "FREE")
    return (
      <>
        <PaidPlanUpgradeModal isOpen={isPaidPlanModalOpen} handleClose={() => togglePaidPlanModal(false)} />
        <Button
          tabIndex={-1}
          variant="accent-primary"
          className="w-fit min-w-24 cursor-pointer rounded-2xl px-4 py-1 text-center text-sm font-medium outline-none"
          onClick={() => togglePaidPlanModal(true)}
        >
          Upgrade plan
        </Button>
      </>
    );

  if (subscriptionDetail.product === "ONE") {
    return <PlaneOneEditionBadge />;
  }

  if (subscriptionDetail.product === "PRO") {
    return (
      <>
        <Button
          tabIndex={-1}
          variant="accent-primary"
          className="w-fit cursor-pointer rounded-2xl px-4 py-1 text-center text-sm font-medium outline-none"
          onClick={() => handleSuccessModalToggle(true)}
        >
          <Image src={PlaneLogo} alt="Plane Pro" width={12} height={12} />
          Plane Pro
        </Button>
      </>
    );
  }
});
