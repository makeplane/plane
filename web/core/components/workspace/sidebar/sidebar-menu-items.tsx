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
import { useTranslation } from "@plane/i18n";
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
  const { extendedSidebarCollapsed, toggleExtendedSidebar } = useAppTheme();
  const { getNavigationPreferences } = useWorkspace();
  // translation
  const { t } = useTranslation();
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
    <div className="flex flex-col gap-0.5">
      {WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS.map((item, _index) => (
        <SidebarItem key={`static_${_index}`} item={item} />
      ))}
      {sortedNavigationItems.map((item, _index) => (
        <SidebarItem key={`dynamic_${_index}`} item={item} />
      ))}
      <SidebarNavItem>
        <button
          type="button"
          onClick={() => toggleExtendedSidebar()}
          className="flex items-center gap-1.5 text-sm font-medium flex-grow text-custom-text-350"
          id="extended-sidebar-toggle"
          aria-label={t(
            extendedSidebarCollapsed
              ? "aria_labels.projects_sidebar.open_extended_sidebar"
              : "aria_labels.projects_sidebar.close_extended_sidebar"
          )}
        >
          <Ellipsis className="flex-shrink-0 size-4" />
          <span>More</span>
        </button>
      </SidebarNavItem>
    </div>
  );
});
