import { observer } from "mobx-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import useOnlineStatus from "@/hooks/use-online-status";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageOfflineBadge = observer(function PageOfflineBadge({ page }: Props) {
  // use online status
  const { isOnline } = useOnlineStatus();

  if (!page.isContentEditable || isOnline) return null;

  return (
    <Tooltip
      tooltipHeading="You are offline."
      tooltipContent="You can continue making changes. They will be synced when you are back online."
    >
      <div className="flex-shrink-0 flex h-7 items-center gap-2 rounded-full bg-layer-1 px-3 py-0.5 text-11 font-medium text-tertiary">
        <span className="flex-shrink-0 size-1.5 rounded-full bg-layer-1" />
        <span>Offline</span>
      </div>
    </Tooltip>
  );
});
