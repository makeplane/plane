"use client";

import { FC } from "react";
// hooks
import { useAppTheme } from "hooks/useTheme";
// components
import { HelpSection, SidebarMenu, SidebarDropdown } from "components/sidebar";

export interface IInstanceSidebar {}

export const InstanceSidebar: FC<IInstanceSidebar> = () => {
  // store
  const { sidebarCollapsed } = useAppTheme();

  return (
    <div
      className={`inset-y-0 z-20 flex h-full flex-shrink-0 flex-grow-0 flex-col border-r border-custom-sidebar-border-200 bg-custom-sidebar-background-100 duration-300 md:relative ${
        sidebarCollapsed ? "" : "md:w-[280px]"
      } ${sidebarCollapsed ? "left-0" : "-left-full md:left-0"}`}
    >
      <div className="flex h-full w-full flex-1 flex-col">
        <SidebarDropdown />
        <SidebarMenu />
        <HelpSection />
      </div>
    </div>
  );
};
