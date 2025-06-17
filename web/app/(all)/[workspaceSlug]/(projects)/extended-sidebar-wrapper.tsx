"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { useLocalStorage } from "@plane/hooks";
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store";
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
  const { storedValue } = useLocalStorage("sidebarWidth", 250);

  useExtendedSidebarOutsideClickDetector(extendedSidebarRef, handleClose, excludedElementId);

  return (
    <div
      id={excludedElementId}
      ref={extendedSidebarRef}
      className={cn(
        `fixed top-0 h-full z-[19] flex flex-col w-[300px]  transform transition-all duration-300 ease-in-out bg-custom-background-100 border-r border-custom-sidebar-border-200 p-4 shadow-md`,
        {
          "translate-x-0 opacity-100": isExtendedSidebarOpened,
          "-translate-x-[600px] opacity-0 w-0": !isExtendedSidebarOpened,
          "border border-l-none shadow-lg rounded-tr-md rounded-br-md": sidebarPeek,
        }
      )}
      style={{
        top: sidebarPeek ? "3rem" : "0",
        bottom: sidebarPeek ? "3rem" : "0",
        left: `${storedValue}px`,
        height: sidebarPeek ? "calc(100% - 6rem)" : "100%",
      }}
    >
      {children}
    </div>
  );
});
