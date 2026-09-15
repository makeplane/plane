/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react";
// types
import type { TPageNavigationTabs } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
// components
import { ListLayout } from "@/components/core/list";
// plane web hooks
import type { EPageStoreType } from "@/hooks/store";
import { usePageStore } from "@/hooks/store";
// local imports
import { PageListBlock } from "./block";

// guards against malformed (cyclic) hierarchies
const MAX_TREE_DEPTH = 20;

type TPagesListRoot = {
  pageType: TPageNavigationTabs;
  storeType: EPageStoreType;
};

function PageListSectionHeader(props: { title: string }) {
  return (
    <div className="border-b border-subtle px-page-x py-2 text-11 font-medium tracking-wide text-tertiary uppercase">
      {props.title}
    </div>
  );
}

export const PagesListRoot = observer(function PagesListRoot(props: TPagesListRoot) {
  const { pageType, storeType } = props;
  // states
  const [expandedPageIds, setExpandedPageIds] = useState<Set<string>>(new Set());
  // store hooks
  const { getCurrentProjectFilteredPageIdsByTab, getPageById, filters } = usePageStore(storeType);
  // derived values
  const filteredPageIds = getCurrentProjectFilteredPageIdsByTab(pageType);

  if (!filteredPageIds) return <></>;

  // searching or filtering shows every match as a flat list
  const isFlatView = filters.searchQuery.trim() !== "" || calculateTotalFilters(filters.filters ?? {}) !== 0;
  if (isFlatView)
    return (
      <ListLayout>
        {filteredPageIds.map((pageId) => (
          <PageListBlock key={pageId} pageId={pageId} storeType={storeType} />
        ))}
      </ListLayout>
    );

  // build the tree, a page whose parent isn't in this tab is shown at the top level
  const visiblePageIds = new Set(filteredPageIds);
  const childPageIdsByParentId: Record<string, string[]> = {};
  const rootPageIds: string[] = [];
  for (const pageId of filteredPageIds) {
    const parentId = getPageById(pageId)?.parent;
    if (parentId && parentId !== pageId && visiblePageIds.has(parentId)) {
      (childPageIdsByParentId[parentId] ??= []).push(pageId);
    } else rootPageIds.push(pageId);
  }
  const favoritePageIds = filteredPageIds.filter((pageId) => getPageById(pageId)?.is_favorite);

  const toggleExpanded = (pageId: string) =>
    setExpandedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });

  const renderTree = (pageIds: string[], depth: number): ReactNode[] =>
    pageIds.flatMap((pageId) => {
      const childPageIds = childPageIdsByParentId[pageId] ?? [];
      const isExpanded = expandedPageIds.has(pageId) && depth < MAX_TREE_DEPTH;
      return [
        <PageListBlock
          key={pageId}
          pageId={pageId}
          storeType={storeType}
          depth={depth}
          hasChildren={childPageIds.length > 0}
          isExpanded={isExpanded}
          onToggleExpand={() => toggleExpanded(pageId)}
        />,
        ...(isExpanded ? renderTree(childPageIds, depth + 1) : []),
      ];
    });

  return (
    <ListLayout>
      {favoritePageIds.length > 0 && (
        <>
          <PageListSectionHeader title="Favorites" />
          {favoritePageIds.map((pageId) => (
            <PageListBlock key={`favorite-${pageId}`} pageId={pageId} storeType={storeType} />
          ))}
          <PageListSectionHeader title="All pages" />
        </>
      )}
      {renderTree(rootPageIds, 0)}
    </ListLayout>
  );
});
