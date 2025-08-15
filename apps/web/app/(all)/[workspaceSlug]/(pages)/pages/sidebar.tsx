import { useRef, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// components
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
import { SidebarDropdown } from "@/components/workspace/sidebar/dropdown";
import { HelpMenu } from "@/components/workspace/sidebar/help-menu";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useAppRail } from "@/hooks/use-app-rail";
import useSize from "@/hooks/use-window-size";
// plane web components
import { PagesAppSidebarList, PagesAppSidebarMenu, PagesAppSidebarQuickActions } from "@/plane-web/components/pages";
import { WorkspaceEditionBadge } from "@/plane-web/components/workspace/edition-badge";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

export const WikiAppSidebar = observer(() => {
  // params
  const { workspaceSlug, pageId } = useParams();
  const pathname = usePathname();
  // state
  const [expandedPageIds, setExpandedPageIds] = useState<string[]>([]);
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { shouldRenderAppRail, isEnabled: isAppRailEnabled } = useAppRail();
  const { fetchParentPages } = usePageStore(EPageStoreType.WORKSPACE);
  const windowSize = useSize();
  // refs
  const ref = useRef<HTMLDivElement>(null);

  // Fetch parent pages if we're on a page detail view
  const { data: parentPagesList } = useSWR(
    workspaceSlug && pageId && pathname?.includes("/pages/") ? `PARENT_PAGES_LIST_${pageId.toString()}` : null,
    workspaceSlug && pageId && pathname?.includes("/pages/") ? () => fetchParentPages(pageId.toString()) : null
  );

  // Optimized parent pages expansion
  const handleParentPagesExpansion = useCallback((parentPages: any[]) => {
    if (!parentPages || parentPages.length === 0) return;

    // Extract all valid page IDs from the parent chain
    const parentIds = parentPages.map((page) => page.id).filter((id) => id !== undefined) as string[];

    // Only add IDs that aren't already in the expanded list
    setExpandedPageIds((prev) => {
      // Create a Set for efficient lookup
      const existingIds = new Set(prev);
      let hasChanges = false;

      // Check each parent ID
      parentIds.forEach((id) => {
        if (!existingIds.has(id)) {
          existingIds.add(id);
          hasChanges = true;
        }
      });

      // Only create a new array if changes were made
      return hasChanges ? Array.from(existingIds) : prev;
    });
  }, []);

  // Only expand parent pages when the page changes
  useEffect(() => {
    if (parentPagesList && parentPagesList.length > 0) {
      handleParentPagesExpansion(parentPagesList);
    }
  }, [parentPagesList, handleParentPagesExpansion]);

  useOutsideClickDetector(ref, () => {
    if (sidebarCollapsed === false) {
      if (window.innerWidth < 768) {
        toggleSidebar();
      }
    }
  });

  useEffect(() => {
    if (windowSize[0] < 768 && !sidebarCollapsed) toggleSidebar();
  }, [windowSize]);

  return (
    <>
      <div className="flex flex-col gap-2 px-4">
        {!shouldRenderAppRail && <SidebarDropdown />}

        {isAppRailEnabled && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-md text-custom-text-200 font-medium px-1 pt-1">Wiki</span>
            <div className="flex items-center gap-2">
              <AppSidebarToggleButton />
            </div>
          </div>
        )}

        <PagesAppSidebarQuickActions />
      </div>
      <div className="flex flex-col gap-1 overflow-x-hidden scrollbar-sm h-full w-full overflow-y-auto pt-3 pb-0.5 vertical-scrollbar px-4">
        <PagesAppSidebarMenu />
        <PagesAppSidebarList expandedPageIds={expandedPageIds} setExpandedPageIds={setExpandedPageIds} />
      </div>
      <div className="flex items-center justify-between p-2 border-t border-custom-border-200 bg-custom-sidebar-background-100 h-12">
        <WorkspaceEditionBadge />
        {!shouldRenderAppRail && <HelpMenu />}
        {!isAppRailEnabled && <AppSidebarToggleButton />}
      </div>
    </>
  );
});
