"use client";

import { FC, ReactNode } from "react";
import { Tooltip } from "@plane/ui";
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

export const NotificationItemOptionButton: FC<TNotificationItemOptionButton> = (props) => {
  const { tooltipContent = "", buttonClassName = "", children, callBack } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip tooltipContent={tooltipContent} isMobile={isMobile}>
      <button
        type="button"
        className={cn(
          "relative flex-shrink-0 w-5 h-5 rounded-sm flex justify-center items-center outline-none bg-custom-background-80 hover:bg-custom-background-90",
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
};
