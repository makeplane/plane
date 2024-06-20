import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { Button } from "@plane/ui";
// hooks
import { useEventTracker } from "@/hooks/store";
// enterprise imports
import { CloudProductsModal, ProPlanDetailsModal } from "@/plane-web/components/license";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const CloudEditionBadge = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  // states
  const [isProPlanModalOpen, setIsProPlanModalOpen] = useState(false);
  const [isProPlanDetailsModalOpen, setProPlanDetailsModalOpen] = useState(false);
  // hooks
  const { captureEvent } = useEventTracker();
  const { fetchWorkspaceSubscribedPlan, subscribedPlan } = useWorkspaceSubscription();
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

  return (
    <>
      <CloudProductsModal isOpen={isProPlanModalOpen} handleClose={() => setIsProPlanModalOpen(false)} />
      <ProPlanDetailsModal isOpen={isProPlanDetailsModalOpen} handleClose={() => setProPlanDetailsModalOpen(false)} />
      {subscribedPlan === "FREE" && (
        <Button
          variant="outline-primary"
          className="w-full cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
          onClick={handleProPlanPurchaseModalOpen}
        >
          Upgrade to Pro
        </Button>
      )}
      {subscribedPlan === "PRO" && (
        <div className="w-full flex justify-start">
          <span className="items-center justify-center px-3.5 py-0.5 text-xs leading-4 rounded-xl bg-custom-primary-100/10 text-custom-primary-100">
            Pro
          </span>
        </div>
      )}
    </>
  );
});
