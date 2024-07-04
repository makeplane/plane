import { observer } from "mobx-react";
// ui
import { Tooltip } from "@plane/ui";
// hooks
import { useInstance } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { PlaneOneEditionBadge, CloudEditionBadge } from "@/plane-web/components/license";
// assets
import packageJson from "package.json";

export const WorkspaceEditionBadge = observer(() => {
  // hooks
  const { isMobile } = usePlatformOS();
  const { instance } = useInstance();

  const DISCO_BASE_URL = process.env.NEXT_PUBLIC_DISCO_BASE_URL || "";

  if (DISCO_BASE_URL.length > 0) {
    return <CloudEditionBadge />;
  }

  if (instance?.product === "plane-one") {
    return <PlaneOneEditionBadge />;
  }

  return (
    <Tooltip tooltipContent={`Version: v${packageJson.version}`} isMobile={isMobile}>
      <div className="w-full cursor-default rounded-md bg-green-500/10 px-2 py-1 text-center text-xs font-medium text-green-500 outline-none leading-6">
        Enterprise Edition
      </div>
    </Tooltip>
  );
});
