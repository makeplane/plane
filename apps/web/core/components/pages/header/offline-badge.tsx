import { WifiOff } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import useOnlineStatus from "@/hooks/use-online-status";

export const PageOfflineBadge = () => {
  // use online status
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <Tooltip
      tooltipHeading="You are offline."
      tooltipContent="You can continue making changes. They will be synced when you are back online."
    >
      <div className="flex-shrink-0 h-6 flex items-center gap-1 px-2 rounded text-custom-text-200 bg-custom-background-80">
        <WifiOff className="flex-shrink-0 size-3.5" />
        <span className="text-xs font-medium">Offline</span>
      </div>
    </Tooltip>
  );
};
