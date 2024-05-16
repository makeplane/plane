"use client";

import { FC, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { HelpSection, SidebarMenu, SidebarDropdown } from "@/components/admin-sidebar";
import { useTheme } from "@/hooks/store";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components

export interface IInstanceSidebar {}

export const InstanceSidebar: FC<IInstanceSidebar> = observer(() => {
  // store
  const { isSidebarCollapsed, toggleSidebar } = useTheme();

  const ref = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(ref, () => {
    if (isSidebarCollapsed === false) {
      if (window.innerWidth < 768) {
        toggleSidebar(!isSidebarCollapsed);
      }
    }
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        toggleSidebar(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [toggleSidebar]);

  return (
    <div
      className={`inset-y-0 z-20 flex h-full flex-shrink-0 flex-grow-0 flex-col border-r border-custom-sidebar-border-200 bg-custom-sidebar-background-100 duration-300
        fixed md:relative
        ${isSidebarCollapsed ? "-ml-[280px]" : ""}
        sm:${isSidebarCollapsed ? "-ml-[280px]" : ""}
        md:ml-0 ${isSidebarCollapsed ? "w-[80px]" : "w-[280px]"}
        lg:ml-0 ${isSidebarCollapsed ? "w-[80px]" : "w-[280px]"}
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
