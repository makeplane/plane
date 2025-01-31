import { useState } from "react";
import { observer } from "mobx-react";
import packageJson from "package.json";
import { useTranslation } from "@plane/i18n";
// ui
import { Button, Tooltip } from "@plane/ui";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// assets
// local components
import { PaidPlanUpgradeModal } from "./upgrade";

export const WorkspaceEditionBadge = observer(() => {
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  // states
  const [isPaidPlanPurchaseModalOpen, setIsPaidPlanPurchaseModalOpen] = useState(false);

  return (
    <>
      <PaidPlanUpgradeModal
        isOpen={isPaidPlanPurchaseModalOpen}
        handleClose={() => setIsPaidPlanPurchaseModalOpen(false)}
      />
      <Tooltip tooltipContent={`Version: v${packageJson.version}`} isMobile={isMobile}>
        <Button
          tabIndex={-1}
          variant="accent-primary"
          className="w-fit min-w-24 cursor-pointer rounded-2xl px-2 py-1 text-center text-sm font-medium outline-none"
          onClick={() => setIsPaidPlanPurchaseModalOpen(true)}
        >
          {t("sidebar.upgrade")}
        </Button>
      </Tooltip>
    </>
  );
});
