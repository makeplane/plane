"use client";

import { FC, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
// hooks
import useAppTheme from "hooks/use-theme";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components
import { HelpSection, SidebarMenu, SidebarDropdown } from "components/sidebar";

export interface IInstanceSidebar {}

export const InstanceSidebar: FC<IInstanceSidebar> = observer(() => {
  // store
  const themeStore = useAppTheme();

  const ref = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(ref, () => {
    if (themeStore.sidebarCollapsed === false) {
      if (window.innerWidth < 768) {
        themeStore.toggleSidebar();
      }
    }
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        themeStore.toggleSidebar(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [themeStore]);

  return (
    <div
      className={`inset-y-0 z-20 flex h-full flex-shrink-0 flex-grow-0 flex-col border-r border-custom-sidebar-border-200 bg-custom-sidebar-background-100 duration-300
        fixed md:relative
        ${themeStore.sidebarCollapsed ? "-ml-[280px]" : ""}
        sm:${themeStore.sidebarCollapsed ? "-ml-[280px]" : ""}
        md:ml-0 ${themeStore.sidebarCollapsed ? "w-[80px]" : "w-[280px]"}
        lg:ml-0 ${themeStore.sidebarCollapsed ? "w-[80px]" : "w-[280px]"}
      `}
    >
      <div ref={ref} className="flex h-full w-full flex-1 flex-col">
        <SidebarDropdown />
        <SidebarMenu />
        <HelpSection />
      </div>
    </div>
  );
});
