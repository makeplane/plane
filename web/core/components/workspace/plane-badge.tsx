import React, { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { Tooltip, Button, getButtonStyling } from "@plane/ui";
// hooks
import { cn } from "@/helpers/common.helper";
import { useEventTracker, useInstance } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { PlaneOneModal, CloudProductsModal, ProPlanDetailsModal } from "@/plane-web/components/license";
// assets
import PlaneOneLogo from "@/public/plane-logos/plane-one.svg";
// services
import { DiscoService } from "@/services/disco.service";

import packageJson from "package.json";

const discoService = new DiscoService();

export const PlaneBadge: React.FC = observer(() => {
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

  // fetch workspace current plane information
  const { data } = useSWR(
    workspaceSlug ? "WORKSPACE_CURRENT_PLANE" : null,
    workspaceSlug ? () => discoService.getWorkspaceCurrentPlane(workspaceSlug.toString()) : null
  );

  console.log("data", data);

  const handleProPlanPurchaseModalOpen = () => {
    setIsProPlanModalOpen(true);
    captureEvent("pro_plan_modal_opened", {});
  };

  const handlePlaneOneModalOpen = () => {
    setIsPlaneOneModalOpen(true);
    captureEvent("plane_one_modal_opened", {});
  };

  // const handleProPlanDetailsModalOpen = () => {
  //   setProPlanDetailsModalOpen(true);
  // };

  if (process.env.NEXT_PUBLIC_IS_MULTI_TENANT === "1") {
    return (
      <>
        <CloudProductsModal isOpen={isProPlanModalOpen} handleClose={() => setIsProPlanModalOpen(false)} />
        <ProPlanDetailsModal isOpen={isProPlanDetailsModalOpen} handleClose={() => setProPlanDetailsModalOpen(false)} />
        {data && data.product === "s" && (
          <Button
            variant="outline-primary"
            className="w-1/2 cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
            onClick={handleProPlanPurchaseModalOpen}
          >
            Upgrade to Pro
          </Button>
        )}
        {data && data.product === "FREE" && (
          <div className="w-1/2 flex justify-start">
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
    <>
      <Tooltip tooltipContent={`Version: v${packageJson.version}`} isMobile={isMobile}>
        <div className="w-1/2 cursor-default rounded-md bg-green-500/10 px-2 py-1 text-center text-xs font-medium text-green-500 outline-none leading-6">
          Enterprise Edition
        </div>
      </Tooltip>
    </>
  );
});
