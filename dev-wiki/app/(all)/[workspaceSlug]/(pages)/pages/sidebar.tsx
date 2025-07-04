import { useRef, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// components
import { SidebarDropdown } from "@/components/workspace";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
// plane web components
import { PagesAppSidebarList, PagesAppSidebarMenu, PagesAppSidebarQuickActions } from "@/plane-web/components/pages";
// import { SidebarAppSwitcher } from "@/plane-web/components/sidebar";
// plane web hooks
import { usePageStore, EPageStoreType } from "@/plane-web/hooks/store/use-page-store";

export const PagesAppSidebar = observer(() => {
  // params
  const { workspaceSlug, pageId } = useParams();
  const pathname = usePathname();
  // state
  const [expandedPageIds, setExpandedPageIds] = useState<string[]>([]);
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { fetchParentPages } = usePageStore(EPageStoreType.WORKSPACE);
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

  return (
    <div
      className={cn(
        "fixed inset-y-0 z-20 flex h-full flex-shrink-0 flex-grow-0 flex-col border-r border-custom-sidebar-border-200 bg-custom-sidebar-background-100 duration-300 w-[250px] md:relative md:ml-0",
        {
          "w-[70px] -ml-[250px]": sidebarCollapsed,
        }
      )}
    >
      <div
        ref={ref}
        className={cn("size-full flex flex-1 flex-col p-4 pb-0", {
          "p-2 pb-0": sidebarCollapsed,
        })}
      >
        <SidebarDropdown />
        <div className="flex-shrink-0 h-4" />
        {/* <SidebarAppSwitcher /> */}
        <PagesAppSidebarQuickActions />
        <hr
          className={cn("flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-3/5 mx-auto my-2", {
            "opacity-0": !sidebarCollapsed,
          })}
        />
        <PagesAppSidebarMenu />
        <hr
          className={cn("flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-3/5 mx-auto my-2", {
            "opacity-0": !sidebarCollapsed,
          })}
        />
        <PagesAppSidebarList expandedPageIds={expandedPageIds} setExpandedPageIds={setExpandedPageIds} />
      </div>
    </div>
  );
});
