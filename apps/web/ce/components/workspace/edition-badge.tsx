import { observer } from "mobx-react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import packageJson from "package.json";

export const WorkspaceEditionBadge = observer(() => {
  // translation
  const { t } = useTranslation();
  // platform
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip tooltipContent={`Version: v${packageJson.version} - Enterprise Edition (All Features Enabled)`} isMobile={isMobile}>
      <Button
        tabIndex={-1}
        variant="accent-primary"
        className="w-fit min-w-24 rounded-2xl px-2 py-1 text-center text-sm font-medium outline-none"
        aria-label={t("aria_labels.projects_sidebar.edition_badge")}
      >
        Enterprise
      </Button>
    </Tooltip>
  );
});
