"use client";

import React from "react";
import { observer } from "mobx-react";
import { MoveLeft } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// ui
import { Tooltip } from "@plane/ui";
// components
import { cn } from "@plane/utils";
// helpers
// hooks
import { useAppTheme } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

export interface WorkspaceHelpSectionProps {
  setSidebarActive?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SidebarHelpSection: React.FC<WorkspaceHelpSectionProps> = observer(() => {
  // store hooks
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const { isMobile } = usePlatformOS();

  const isCollapsed = sidebarCollapsed || false;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between px-2 self-baseline border-t border-custom-border-200 bg-custom-sidebar-background-100 h-12 flex-shrink-0",
        {
          "flex-col h-auto py-1.5": isCollapsed,
        }
      )}
    >
      <div
        className={cn("w-full flex-grow px-0.5", {
          hidden: isCollapsed,
        })}
      >
        {/* WorkspaceEditionBadge temporarily removed */}
      </div>
      <div
        className={`flex flex-shrink-0 items-center gap-1 ${isCollapsed ? "flex-col justify-center" : "justify-evenly"}`}
      >
        <Tooltip tooltipContent={`${isCollapsed ? "Expand" : "Hide"}`} isMobile={isMobile}>
          <button
            type="button"
            className={`grid place-items-center rounded-md p-1 text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 ${
              isCollapsed ? "w-full" : ""
            }`}
            onClick={() => toggleSidebar()}
            aria-label={t(
              isCollapsed
                ? "aria_labels.projects_sidebar.expand_sidebar"
                : "aria_labels.projects_sidebar.collapse_sidebar"
            )}
          >
            <MoveLeft className={`size-4 duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
});
