import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { Tooltip, Button, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useInstance, useEventTracker } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { PlaneOneModal, CloudProductsModal, ProPlanDetailsModal } from "@/plane-web/components/license";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import PlaneOneLogo from "@/public/plane-logos/plane-one.svg";
// assets
import packageJson from "package.json";

export const WorkspaceEditionBadge = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  // states
  const [isProPlanModalOpen, setIsProPlanModalOpen] = useState(false);
  const [isProPlanDetailsModalOpen, setProPlanDetailsModalOpen] = useState(false);
  const [isPlaneOneModalOpen, setIsPlaneOneModalOpen] = useState(false);
  // hooks
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
  const { instance } = useInstance();
  const { fetchWorkspaceSubscribedPlan, subscribedPlan } = useWorkspaceSubscription();
  // fetch workspace current plane information
  useSWR(
    workspaceSlug && process.env.NEXT_PUBLIC_IS_MULTI_TENANT === "1" ? `WORKSPACE_CURRENT_PLAN_${workspaceSlug}` : null,
    workspaceSlug && process.env.NEXT_PUBLIC_IS_MULTI_TENANT === "1"
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

  const handlePlaneOneModalOpen = () => {
    setIsPlaneOneModalOpen(true);
    captureEvent("plane_one_modal_opened", {});
  };

  if (process.env.NEXT_PUBLIC_IS_MULTI_TENANT === "1") {
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
  }

  if (instance?.product === "plane-one") {
    return (
      <>
        <PlaneOneModal isOpen={isPlaneOneModalOpen} handleClose={() => setIsPlaneOneModalOpen(false)} />
        <Tooltip tooltipContent={`Version: ${instance.current_version}`} isMobile={isMobile}>
          <button
            tabIndex={-1}
            className={cn(
              getButtonStyling("accent-primary", "md"),
              "w-fit cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
            )}
            onClick={handlePlaneOneModalOpen}
          >
            <Image src={PlaneOneLogo} alt="Plane One" width={24} height={24} />
            {"Plane One"}
          </button>
        </Tooltip>
      </>
    );
  }

  return (
    <Tooltip tooltipContent={`Version: v${packageJson.version}`} isMobile={isMobile}>
      <div className="w-full cursor-default rounded-md bg-green-500/10 px-2 py-1 text-center text-xs font-medium text-green-500 outline-none leading-6">
        Enterprise Edition
      </div>
    </Tooltip>
  );
});
