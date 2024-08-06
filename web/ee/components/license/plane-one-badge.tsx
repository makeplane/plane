import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { Button, Tooltip } from "@plane/ui";
// hooks
import { useInstance, useEventTracker } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { ProPlanSelfHostUpgradeModal } from "@/plane-web/components/license";

export const PlaneOneEditionBadge = observer(() => {
  // states
  const [isProPlanSuccessModalOpen, setProPlanSuccessModalOpen] = useState(false);
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const { instance } = useInstance();
  const { captureEvent } = useEventTracker();

  const handlePlaneOneModalOpen = () => {
    setProPlanSuccessModalOpen(true);
    captureEvent("plane_one_modal_opened", {});
  };

  return (
    <>
      <ProPlanSelfHostUpgradeModal
        isOpen={isProPlanSuccessModalOpen}
        handleClose={() => setProPlanSuccessModalOpen(false)}
      />
      <Tooltip tooltipContent={`Version: ${instance?.current_version}`} isMobile={isMobile}>
        <Button
          variant="accent-primary"
          tabIndex={-1}
          className="w-full cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
          onClick={handlePlaneOneModalOpen}
        >
          Upgrade to Pro
        </Button>
      </Tooltip>
    </>
  );
});
