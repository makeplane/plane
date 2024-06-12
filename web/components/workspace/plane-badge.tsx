import React, { useState } from "react";
import Image from "next/image";
// ui
import { Tooltip, Button, getButtonStyling } from "@plane/ui";
// components
import { PlaneOneModal, CloudProductsModal } from "@/components/license";
// hooks
import { cn } from "@/helpers/common.helper";
import { useEventTracker, useInstance } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// assets
import PlaneOneLogo from "@/public/plane-logos/plane-one.svg";
import packageJson from "package.json";

export const PlaneBadge: React.FC = () => {
  // states
  const [isProPlanModalOpen, setIsProPlanModalOpen] = useState(false);
  const [isPlaneOneModalOpen, setIsPlaneOneModalOpen] = useState(false);
  // hooks
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
  const { instance } = useInstance();

  const handleProPlanModalOpen = () => {
    setIsProPlanModalOpen(true);
    captureEvent("pro_plan_modal_opened", {});
  };

  const handlePlaneOneModalOpen = () => {
    setIsPlaneOneModalOpen(true);
    captureEvent("plane_one_modal_opened", {});
  };

  if (process.env.NEXT_PUBLIC_DISCO_BASE_URL !== "") {
    return (
      <>
        <CloudProductsModal isOpen={isProPlanModalOpen} handleClose={() => setIsProPlanModalOpen(false)} />
        <Button
          variant="outline-primary"
          className="w-1/2 cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
          onClick={handleProPlanModalOpen}
        >
          Plane Pro
        </Button>
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
};
