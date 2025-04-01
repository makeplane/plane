"use client";
import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Ellipsis } from "lucide-react";
// plane imports
import {
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS,
  WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS,
} from "@plane/constants";
import { cn } from "@plane/utils";
// components
import { SidebarNavItem } from "@/components/sidebar";
// store hooks
import { useAppTheme, useWorkspace } from "@/hooks/store";
// plane-web imports
import { SidebarItem } from "@/plane-web/components/workspace/sidebar";

export const SidebarMenuItems = observer(() => {
  // routers
  const { workspaceSlug } = useParams();
  // store hooks
  const { sidebarCollapsed, toggleExtendedSidebar } = useAppTheme();
  const { getNavigationPreferences } = useWorkspace();

  // derived values
  const currentWorkspaceNavigationPreferences = getNavigationPreferences(workspaceSlug.toString());

  const sortedNavigationItems = useMemo(
    () =>
      WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS.map((item) => {
        const preference = currentWorkspaceNavigationPreferences?.[item.key];
        return {
          ...item,
          sort_order: preference ? preference.sort_order : 0,
        };
      }).sort((a, b) => a.sort_order - b.sort_order),
    [currentWorkspaceNavigationPreferences]
  );

  return (
    <>
      <div
        className={cn("flex flex-col gap-0.5", {
          "space-y-0": sidebarCollapsed,
        })}
      >
        {WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS.map((item, _index) => (
          <SidebarItem key={`static_${_index}`} item={item} />
        ))}
        {sortedNavigationItems.map((item, _index) => (
          <SidebarItem key={`dynamic_${_index}`} item={item} />
        ))}
        <SidebarNavItem className={`${sidebarCollapsed ? "p-0 size-8 aspect-square justify-center mx-auto" : ""}`}>
          <button
            onClick={() => toggleExtendedSidebar()}
            className={cn("flex items-center gap-1.5 text-sm font-medium flex-grow text-custom-text-350", {
              "justify-center": sidebarCollapsed,
            })}
            id="extended-sidebar-toggle"
          >
            <Ellipsis className="size-4" />
            {!sidebarCollapsed && <span>More</span>}
          </button>
        </SidebarNavItem>
      </div>
    </>
  );
});
