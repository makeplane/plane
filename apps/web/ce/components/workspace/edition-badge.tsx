import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import packageJson from "package.json";
// local components
import { PaidPlanUpgradeModal } from "../license";

export const WorkspaceEditionBadge = observer(() => {
  // states
  const [isPaidPlanPurchaseModalOpen, setIsPaidPlanPurchaseModalOpen] = useState(false);
  // translation
  const { t } = useTranslation();
  // platform
  const { isMobile } = usePlatformOS();

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
          aria-haspopup="dialog"
          aria-label={t("aria_labels.projects_sidebar.edition_badge")}
        >
          Community
        </Button>
      </Tooltip>
    </>
  );
});
