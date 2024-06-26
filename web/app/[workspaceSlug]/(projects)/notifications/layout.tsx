"use client";

import { useState } from "react";
import { PanelLeft } from "lucide-react";
// components
import { AppHeader } from "@/components/core";
import { NotificationsSidebarRoot } from "@/components/workspace-notifications";
// helpers
import { cn } from "@/helpers/common.helper";
// local components
import { WorkspaceNotificationHeader } from "./header";

export default function ProjectInboxIssuesLayout({ children }: { children: React.ReactNode }) {
  // states
  const [mobileSidebarToggle, setMobileSidebarToggle] = useState(false);
  const handleMobileSidebarToggle = () => setMobileSidebarToggle((prev) => !prev);

  return (
    <>
      <AppHeader header={<WorkspaceNotificationHeader />} />
      <div className="relative w-full h-full overflow-hidden flex flex-col">
        <div className="flex-shrink-0 h-[46px] border-b border-custom-border-200 relative flex lg:hidden items-center px-5">
          <div
            className="rounded-sm h-6 w-6 transition-all relative flex justify-center items-center overflow-hidden cursor-pointer hover:bg-custom-background-80"
            onClick={handleMobileSidebarToggle}
          >
            <PanelLeft
              className={cn("w-4 h-4 ", mobileSidebarToggle ? "text-custom-primary-100" : " text-custom-text-200")}
            />
          </div>
        </div>
        <div className="relative w-full h-full overflow-hidden flex items-center">
          <div
            className={cn(
              "absolute lg:relative w-full lg:w-2/6 border-0 lg:border-r border-custom-border-200 z-[10] flex-shrink-0 bg-custom-background-100 h-full transition-all overflow-hidden",
              mobileSidebarToggle ? "translate-x-0" : "-translate-x-full lg:!translate-x-0"
            )}
          >
            <NotificationsSidebarRoot />
          </div>
          <div className="w-full h-full overflow-hidden overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}
