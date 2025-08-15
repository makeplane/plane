"use client";

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { PanelLeft, PanelRight } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";

export const SidebarToggle = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  // derived values
  const isSidebarAccessible = !!workspaceSlug?.toString() || pathname.includes("/profile/");
  const isSidebarCollapsed = useMemo(() => sidebarCollapsed, [sidebarCollapsed]);

  if (!isSidebarAccessible) {
    return null;
  }

  return (
    <>
      <Tooltip tooltipContent={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} position="bottom">
        <button
          onClick={(e) => {
            toggleSidebar(!isSidebarCollapsed);
            e.currentTarget.blur();
          }}
          className={cn(
            "ml-2 mr-1 size-6 flex items-center justify-center rounded cursor-pointer text-custom-text-300 hover:text-custom-text-200",
            {
              "text-custom-text-200": !isSidebarCollapsed,
            }
          )}
        >
          {isSidebarCollapsed ? (
            <PanelRight className="size-4" strokeWidth={2.5} />
          ) : (
            <PanelLeft className="size-4" strokeWidth={2.5} />
          )}
        </button>
      </Tooltip>
    </>
  );
});
