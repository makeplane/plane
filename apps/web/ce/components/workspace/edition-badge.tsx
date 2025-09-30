import { useState } from "react";
import { observer } from "mobx-react";
// ui
import packageJson from "package.json";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { Button } from "@plane/ui";
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
import { HelpMenu } from "@/components/workspace/sidebar/help-menu";
// hooks
import { useAppRail } from "@/hooks/use-app-rail";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import { PaidPlanUpgradeModal } from "../license";

export const WorkspaceEditionBadge = observer(() => {
  // states
  const [isPaidPlanPurchaseModalOpen, setIsPaidPlanPurchaseModalOpen] = useState(false);
  // translation
  const { t } = useTranslation();
  // hooks
  const { shouldRenderAppRail, isEnabled: isAppRailEnabled } = useAppRail();

  // platform
  const { isMobile } = usePlatformOS();

  return (
    <div className="flex items-center justify-between p-3 border-t border-custom-border-200 bg-custom-sidebar-background-100 h-12">
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
      <div className="flex items-center gap-2">
        {!shouldRenderAppRail && <HelpMenu />}
        {!isAppRailEnabled && <AppSidebarToggleButton />}
      </div>
    </div>
  );
});
