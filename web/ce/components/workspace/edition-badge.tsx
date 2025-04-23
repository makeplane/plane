import { useState } from "react";
import { observer } from "mobx-react";
import packageJson from "package.json";
// ui
import { Button, Tooltip } from "@plane/ui";
// hooks
import { cn } from "@plane/utils";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import { PaidPlanUpgradeModal } from "../license";

export const WorkspaceEditionBadge = observer((props: { className?: string; isEditable?: boolean }) => {
  const { className, isEditable = true } = props;
  const { isMobile } = usePlatformOS();
  // states
  const [isPaidPlanPurchaseModalOpen, setIsPaidPlanPurchaseModalOpen] = useState(false);

  return (
    <>
      {isEditable && (
        <PaidPlanUpgradeModal
          isOpen={isPaidPlanPurchaseModalOpen}
          handleClose={() => setIsPaidPlanPurchaseModalOpen(false)}
        />
      )}
      <Tooltip tooltipContent={`Version: v${packageJson.version}`} isMobile={isMobile}>
        <Button
          tabIndex={-1}
          variant="accent-primary"
          className={cn(
            "w-fit min-w-24 cursor-pointer rounded-2xl px-2 py-1 text-center text-sm font-medium outline-none",
            className
          )}
          onClick={() => setIsPaidPlanPurchaseModalOpen(true)}
        >
          Community
        </Button>
      </Tooltip>
    </>
  );
});
