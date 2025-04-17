import { observer } from "mobx-react";
// plane imports
import { Tooltip } from "@plane/ui";
// hooks
import useOnlineStatus from "@/hooks/use-online-status";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageOfflineBadge = observer(({ page }: Props) => {
  // use online status
  const { isOnline } = useOnlineStatus();

  if (!page.isContentEditable || isOnline) return null;

  return (
    <Tooltip
      tooltipHeading="You are offline."
      tooltipContent="You can continue making changes. They will be synced when you are back online."
    >
      <div className="flex-shrink-0 flex h-7 items-center gap-2 rounded-full bg-custom-background-80 px-3 py-0.5 text-xs font-medium text-custom-text-300">
        <span className="flex-shrink-0 size-1.5 rounded-full bg-custom-text-300" />
        <span>Offline</span>
      </div>
    </Tooltip>
  );
});
