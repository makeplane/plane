"use client";

// components
import { NotificationsSidebarRoot } from "@/components/workspace-notifications";
// helpers
import { cn } from "@/helpers/common.helper";

export default function ProjectInboxIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="relative w-full h-full overflow-hidden flex flex-col">
        <div className="relative w-full h-full overflow-hidden flex items-center">
          <div
            // className={cn(
            //   "absolute lg:relative w-full lg:w-2/6 border-0 lg:border-r border-custom-border-200 z-[10] flex-shrink-0 bg-custom-background-100 h-full transition-all overflow-hidden",
            //   mobileSidebarToggle ? "translate-x-0" : "-translate-x-full lg:!translate-x-0"
            // )}
            className={cn(
              "relative w-full lg:w-2/6 border-0 lg:border-r border-custom-border-200 z-[10] flex-shrink-0 bg-custom-background-100 h-full transition-all overflow-hidden"
            )}
          >
            <NotificationsSidebarRoot />
          </div>
          <div className="w-full h-full overflow-hidden overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
