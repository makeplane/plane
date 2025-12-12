import type { ReactNode } from "react";
import { Tooltip } from "@plane/propel/tooltip";
// helpers
import { cn } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TNotificationItemOptionButton = {
  tooltipContent?: string;
  buttonClassName?: string;
  callBack: () => void;
  children: ReactNode;
};

export function NotificationItemOptionButton(props: TNotificationItemOptionButton) {
  const { tooltipContent = "", buttonClassName = "", children, callBack } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip tooltipContent={tooltipContent} isMobile={isMobile}>
      <button
        type="button"
        className={cn(
          "relative flex-shrink-0 w-5 h-5 rounded-xs flex justify-center items-center outline-none bg-layer-1 hover:bg-surface-2",
          buttonClassName
        )}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          callBack && callBack();
        }}
      >
        {children}
      </button>
    </Tooltip>
  );
}
