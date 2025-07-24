"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EXTENDED_SIDEBAR_WIDTH, SIDEBAR_WIDTH } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { cn } from "@plane/utils";
// hooks
import useExtendedSidebarOutsideClickDetector from "@/hooks/use-extended-sidebar-overview-outside-click";

type Props = {
  children: React.ReactNode;
  extendedSidebarRef: React.RefObject<HTMLDivElement>;
  isExtendedSidebarOpened: boolean;
  handleClose: () => void;
  excludedElementId: string;
};

export const ExtendedSidebarWrapper: FC<Props> = observer((props) => {
  const { children, extendedSidebarRef, isExtendedSidebarOpened, handleClose, excludedElementId } = props;
  // store hooks
  const { storedValue } = useLocalStorage("sidebarWidth", SIDEBAR_WIDTH);

  useExtendedSidebarOutsideClickDetector(extendedSidebarRef, handleClose, excludedElementId);

  return (
    <div
      id={excludedElementId}
      ref={extendedSidebarRef}
      className={cn(
        `absolute h-full z-[19] flex flex-col py-2 transform transition-all duration-300 ease-in-out bg-custom-sidebar-background-100 border-r border-custom-sidebar-border-200 p-4 shadow-sm`,
        {
          "translate-x-0 opacity-100": isExtendedSidebarOpened,
          [`-translate-x-[${EXTENDED_SIDEBAR_WIDTH}px] opacity-0 hidden`]: !isExtendedSidebarOpened,
        }
      )}
      style={{
        left: `${storedValue ?? SIDEBAR_WIDTH}px`,
        width: `${isExtendedSidebarOpened ? EXTENDED_SIDEBAR_WIDTH : 0}px`,
      }}
    >
      {children}
    </div>
  );
});
