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
  const [isProPlanDetailsModalOpen, setProPlanDetailsModalOpen] = useState(false);
  // hooks
  const { captureEvent } = useEventTracker();
  const { isProPlanModalOpen, currentWorkspaceSubscribedPlanDetail, toggleProPlanModal, fetchWorkspaceSubscribedPlan } =
    useWorkspaceSubscription();
  // fetch workspace current plane information
  useSWR(
    workspaceSlug && process.env.NEXT_PUBLIC_DISCO_BASE_URL ? `WORKSPACE_CURRENT_PLAN_${workspaceSlug}` : null,
    workspaceSlug && process.env.NEXT_PUBLIC_DISCO_BASE_URL
      ? () => fetchWorkspaceSubscribedPlan(workspaceSlug.toString())
      : null,
    {
      errorRetryCount: 2,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const handleProPlanPurchaseModalOpen = () => {
    toggleProPlanModal(true);
    captureEvent("pro_plan_modal_opened", {});
  };

  const handleProPlanDetailsModalOpen = () => {
    setProPlanDetailsModalOpen(true);
    captureEvent("pro_plan_details_modal_opened", {});
  };

  if (!currentWorkspaceSubscribedPlanDetail)
    return (
      <Loader className="flex h-full">
        <Loader.Item height="30px" width="95%" />
      </Loader>
    );

  return (
    <>
      {currentWorkspaceSubscribedPlanDetail.product === "FREE" && (
        <>
          <CloudProductsModal isOpen={isProPlanModalOpen} handleClose={() => toggleProPlanModal(false)} />
          <Button
            tabIndex={-1}
            variant="accent-primary"
            className="w-full cursor-pointer rounded-2xl px-4 py-1.5 text-center text-sm font-medium outline-none"
            onClick={handleProPlanPurchaseModalOpen}
          >
            Upgrade to Pro
          </Button>
        </>
      )}
      {currentWorkspaceSubscribedPlanDetail.product === "PRO" && (
        <>
          <ProPlanDetailsModal
            isOpen={isProPlanDetailsModalOpen}
            handleClose={() => setProPlanDetailsModalOpen(false)}
          />
          <Button
            tabIndex={-1}
            variant="accent-primary"
            className="w-full cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
            onClick={handleProPlanDetailsModalOpen}
          >
            <Image src={PlaneLogo} alt="Plane Pro" width={14} height={14} />
            {"Plane Pro"}
          </Button>
        </>
      )}
    </>
  );
});
