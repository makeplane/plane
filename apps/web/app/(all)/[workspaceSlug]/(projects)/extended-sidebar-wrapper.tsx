import React, { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { EXTENDED_SIDEBAR_WIDTH, SIDEBAR_WIDTH } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
// hooks
import useExtendedSidebarOutsideClickDetector from "@/hooks/use-extended-sidebar-overview-outside-click";

type Props = {
  className?: string;
  children: React.ReactNode;
  extendedSidebarRef: React.RefObject<HTMLDivElement>;
  isExtendedSidebarOpened: boolean;
  handleClose: () => void;
  excludedElementId: string;
};

export const ExtendedSidebarWrapper = observer(function ExtendedSidebarWrapper(props: Props) {
  const { className, children, extendedSidebarRef, isExtendedSidebarOpened, handleClose, excludedElementId } = props;
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  // local storage
  const { storedValue } = useLocalStorage("sidebarWidth", SIDEBAR_WIDTH);

  useExtendedSidebarOutsideClickDetector(extendedSidebarRef, handleClose, excludedElementId);

  useEffect(() => {
    if (sidebarCollapsed) {
      handleClose();
    }
  }, [sidebarCollapsed, handleClose]);

  return (
    <div
      id={excludedElementId}
      ref={extendedSidebarRef}
      className={cn(
        "absolute h-full z-[21] flex flex-col py-2 transform transition-all duration-300 ease-in-out bg-surface-1 border-r border-subtle p-4 shadow-sm",
        {
          "opacity-100": isExtendedSidebarOpened,
          "opacity-0 hidden": !isExtendedSidebarOpened,
        },
        className
      )}
      style={{
        left: `${storedValue ?? SIDEBAR_WIDTH}px`,
        width: `${EXTENDED_SIDEBAR_WIDTH}px`,
      }}
    >
      {children}
    </div>
  );
});
