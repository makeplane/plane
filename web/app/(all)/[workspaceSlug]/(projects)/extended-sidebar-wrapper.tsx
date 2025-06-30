"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { SIDEBAR_WIDTH } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store";
import { useAppRail } from "@/hooks/use-app-rail";
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
  const { sidebarPeek } = useAppTheme();
  const { shouldRenderAppRail } = useAppRail();
  const { storedValue } = useLocalStorage("sidebarWidth", SIDEBAR_WIDTH);

  useExtendedSidebarOutsideClickDetector(extendedSidebarRef, handleClose, excludedElementId);

  return (
    <div
      id={excludedElementId}
      ref={extendedSidebarRef}
      className={cn(
        `fixed h-full z-[19] flex flex-col w-[300px] py-2 transform transition-all duration-300 ease-in-out bg-custom-background-100 border border-l-0 border-custom-sidebar-border-200 p-4 shadow-sm`,
        {
          "translate-x-0 opacity-100": isExtendedSidebarOpened,
          "-translate-x-[600px] opacity-0 w-0": !isExtendedSidebarOpened,
          "border border-l-none rounded-tr-md rounded-br-md": sidebarPeek,
        }
      )}
      style={{
        top: sidebarPeek ? "3rem" : "0.5rem",
        bottom: sidebarPeek ? "3rem" : "0.5rem",
        left: `${(storedValue ?? SIDEBAR_WIDTH) + (shouldRenderAppRail && !sidebarPeek ? 60 : 0)}px`,
        height: sidebarPeek ? "calc(100% - 6rem)" : "calc(100% - 1.25rem)",
      }}
    >
      {children}
    </div>
  );
});
