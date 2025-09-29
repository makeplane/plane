import { useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// components
import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper";
// hooks
// plane web components
import { PagesAppSidebarList, PagesAppSidebarMenu, PagesAppSidebarQuickActions } from "@/plane-web/components/pages";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

export const WikiAppSidebar = observer(() => {
  // params
  const { workspaceSlug, pageId } = useParams();
  const pathname = usePathname();
  // state
  const [expandedPageIds, setExpandedPageIds] = useState<string[]>([]);
  // store hooks
  const { fetchParentPages } = usePageStore(EPageStoreType.WORKSPACE);

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

  return (
    <SidebarWrapper title="Wiki" quickActions={<PagesAppSidebarQuickActions />}>
      <PagesAppSidebarMenu />
      <PagesAppSidebarList expandedPageIds={expandedPageIds} setExpandedPageIds={setExpandedPageIds} />
    </SidebarWrapper>
  );
});
