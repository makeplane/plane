"use client";
import { FC, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useLocalStorage } from "@plane/hooks";
// hooks
import { useAppTheme } from "@/hooks/store";
// local imports
import { ExtendedProjectSidebar } from "./extended-project-sidebar";
import { ExtendedAppSidebar } from "./extended-sidebar";
import { ResizableSidebar } from "./resizeable-sidebar";
import { AppSidebar } from "./sidebar";

export const ProjectAppSidebar: FC = observer(() => {
  // store hooks
  const {
    sidebarCollapsed,
    toggleSidebar,
    sidebarPeek,
    toggleSidebarPeek,
    extendedSidebarCollapsed,
    extendedProjectSidebarCollapsed,
  } = useAppTheme();
  const { storedValue, setValue } = useLocalStorage("sidebarWidth", 250);
  // states
  const [sidebarWidth, setSidebarWidth] = useState<number>(storedValue ?? 250);
  // derived values
  const anyExtendedSidebarCollapsed = extendedSidebarCollapsed || extendedProjectSidebarCollapsed;

  // handlers
  const handleWidthChange = (width: number) => setValue(width);

  return (
    <>
      <ResizableSidebar
        showPeek={sidebarPeek}
        defaultWidth={storedValue ?? 250}
        width={sidebarWidth}
        setWidth={setSidebarWidth}
        defaultCollapsed={sidebarCollapsed}
        peekDuration={1500}
        onWidthChange={handleWidthChange}
        onCollapsedChange={toggleSidebar}
        isCollapsed={sidebarCollapsed}
        toggleCollapsed={toggleSidebar}
        togglePeek={toggleSidebarPeek}
        extendedSidebar={
          <>
            <ExtendedAppSidebar />
            <ExtendedProjectSidebar />
          </>
        }
        isAnyExtendedSidebarExpanded={anyExtendedSidebarCollapsed}
      >
        <AppSidebar />
      </ResizableSidebar>
    </>
  );
});
