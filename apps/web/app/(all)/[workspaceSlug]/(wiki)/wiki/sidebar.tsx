/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

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

export const WikiAppSidebar = observer(function WikiAppSidebar() {
  // params
  const { workspaceSlug, pageId } = useParams();
  const pathname = usePathname();
  const isCollectionRoute = pathname?.includes("/wiki/collections/");
  const currentPageId = !isCollectionRoute && pageId ? pageId.toString() : undefined;
  // state
  const [expandedPageIds, setExpandedPageIds] = useState<string[]>([]);
  // store hooks
  const { fetchParentPages } = usePageStore(EPageStoreType.WORKSPACE);

  // Fetch parent pages if we're on a page detail view
  const { data: parentPagesList } = useSWR(
    workspaceSlug && currentPageId ? `PARENT_PAGES_LIST_${currentPageId}` : null,
    workspaceSlug && currentPageId ? () => fetchParentPages(currentPageId) : null
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
