import { observer } from "mobx-react";
// ui
import { Tooltip } from "@plane/ui";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// assets
import packageJson from "package.json";

export const WorkspaceEditionBadge = observer(() => {
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip tooltipContent={`Version: v${packageJson.version}`} isMobile={isMobile}>
      <div className="w-full cursor-default rounded-md bg-green-500/10 px-2 py-1 text-center text-xs font-medium text-green-500 outline-none leading-6">
        Community
      </div>
    </Tooltip>
  );
});
