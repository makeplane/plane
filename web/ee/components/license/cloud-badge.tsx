import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { Button, Loader } from "@plane/ui";
// hooks
import { useEventTracker } from "@/hooks/store";
// enterprise imports
import { CloudProductsModal, ProPlanDetailsModal } from "@/plane-web/components/license";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";

export const CloudEditionBadge = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  // states
  const [isProPlanModalOpen, setIsProPlanModalOpen] = useState(false);
  const [isProPlanDetailsModalOpen, setProPlanDetailsModalOpen] = useState(false);
  // hooks
  const { captureEvent } = useEventTracker();
  const { currentWorkspaceSubscribedPlan, fetchWorkspaceSubscribedPlan } = useWorkspaceSubscription();
  // fetch workspace current plane information
  useSWR(
    workspaceSlug && process.env.NEXT_PUBLIC_DISCO_BASE_URL ? `WORKSPACE_CURRENT_PLAN_${workspaceSlug}` : null,
    workspaceSlug && process.env.NEXT_PUBLIC_DISCO_BASE_URL
      ? () => fetchWorkspaceSubscribedPlan(workspaceSlug.toString())
      : null,
    {
      errorRetryCount: 2,
    }
  );

  const handleProPlanPurchaseModalOpen = () => {
    setIsProPlanModalOpen(true);
    captureEvent("pro_plan_modal_opened", {});
  };

  const handleProPlanDetailsModalOpen = () => {
    setProPlanDetailsModalOpen(true);
    captureEvent("pro_plan_details_modal_opened", {});
  };

  if (!currentWorkspaceSubscribedPlan)
    return (
      <Loader className="flex h-full">
        <Loader.Item height="30px" width="95%" />
      </Loader>
    );

  return (
    <>
      <CloudProductsModal isOpen={isProPlanModalOpen} handleClose={() => setIsProPlanModalOpen(false)} />
      <ProPlanDetailsModal isOpen={isProPlanDetailsModalOpen} handleClose={() => setProPlanDetailsModalOpen(false)} />
      {currentWorkspaceSubscribedPlan === "FREE" && (
        <Button
          tabIndex={-1}
          variant="accent-primary"
          className="w-full cursor-pointer rounded-2xl px-4 py-1.5 text-center text-sm font-medium outline-none"
          onClick={handleProPlanPurchaseModalOpen}
        >
          Upgrade to Pro
        </Button>
      )}
      {currentWorkspaceSubscribedPlan === "PRO" && (
        <Button
          tabIndex={-1}
          variant="accent-primary"
          className="w-full cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
          onClick={handleProPlanDetailsModalOpen}
        >
          <Image src={PlaneLogo} alt="Plane Pro" width={14} height={14} />
          {"Plane Pro"}
        </Button>
      )}
    </>
  );
});
