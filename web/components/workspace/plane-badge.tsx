import React, { useState } from "react";
// ui
import { Tooltip, Button } from "@plane/ui";
// components
import { ProPlanModal } from "@/components/license";
// hooks
import { useEventTracker } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// assets
import packageJson from "package.json";

export const PlaneBadge: React.FC = () => {
  // states
  const [isProPlanModalOpen, setIsProPlanModalOpen] = useState(false);
  // hooks
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();

  const handleProPlanModalOpen = () => {
    setIsProPlanModalOpen(true);
    captureEvent("pro_plan_modal_opened", {});
  };

  return (
    <>
      <ProPlanModal isOpen={isProPlanModalOpen} handleClose={() => setIsProPlanModalOpen(false)} />
      {process.env.NEXT_PUBLIC_PRO_PLAN_MONTHLY_REDIRECT_URL || process.env.NEXT_PUBLIC_PRO_PLAN_YEARLY_REDIRECT_URL ? (
        <Button
          variant="outline-primary"
          className="w-1/2 cursor-pointer rounded-2xl px-2.5 py-1.5 text-center text-sm font-medium outline-none"
          onClick={handleProPlanModalOpen}
        >
          Plane Pro
        </Button>
      ) : (
        <Tooltip tooltipContent={`Version: v${packageJson.version}`} isMobile={isMobile}>
          <div className="w-1/2 cursor-default rounded-md bg-green-500/10 px-2 py-1 text-center text-xs font-medium text-green-500 outline-none leading-6">
            Enterprise Edition
          </div>
        </Tooltip>
      )}
    </>
  );
};
