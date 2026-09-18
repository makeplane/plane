/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TPageNavigationTabs } from "@plane/types";
import { calculateTotalFilters, cn } from "@plane/utils";
// components
import { ListLayout } from "@/components/core/list";
// plane web hooks
import type { EPageStoreType } from "@/hooks/store";
import { usePageStore } from "@/hooks/store";
// services
import { ProjectPageService } from "@/services/page";
// local imports
import { PageListBlock } from "./block";

const projectPageService = new ProjectPageService();

// guards against malformed (cyclic) hierarchies
const MAX_TREE_DEPTH = 20;

type TPagesListRoot = {
  pageType: TPageNavigationTabs;
  storeType: EPageStoreType;
};

function PageListSectionHeader(props: { title: string; onDropToRoot?: (draggedPageId: string) => void }) {
  const { title, onDropToRoot } = props;
  // refs
  const headerRef = useRef<HTMLDivElement | null>(null);
  // states
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  useEffect(() => {
    const element = headerRef.current;
    if (!element || !onDropToRoot) return;
    return dropTargetForElements({
      element,
      canDrop: ({ source }) => source.data.type === "PAGE",
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source }) => {
        setIsDraggedOver(false);
        if (typeof source.data.id === "string") onDropToRoot(source.data.id);
      },
    });
  }, [onDropToRoot]);

  return (
    <div
      ref={headerRef}
      className={cn(
        "border-b border-subtle px-page-x py-1 text-11 font-medium tracking-wide text-tertiary uppercase",
        isDraggedOver && "bg-layer-1 text-secondary"
      )}
    >
      {isDraggedOver && onDropToRoot ? "Drop here to move to the top level" : title}
    </div>
  );
}

export const PagesListRoot = observer(function PagesListRoot(props: TPagesListRoot) {
  const { pageType, storeType } = props;
  // states
  const [expandedPageIds, setExpandedPageIds] = useState<Set<string>>(new Set());
  // router
  const { workspaceSlug, projectId } = useParams();
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

  // dragging a page onto another makes it a sub-page, this is the only thing that changes the hierarchy
  const handleMovePage = async (draggedPageId: string, targetPageId: string | null) => {
    const draggedPage = getPageById(draggedPageId);
    if (!draggedPage || !workspaceSlug || !projectId || draggedPageId === targetPageId) return;
    if ((draggedPage.parent ?? null) === targetPageId) return;
    // a page can't be moved under one of its own sub-pages
    let ancestorId: string | null | undefined = targetPageId;
    let depth = 0;
    while (ancestorId && depth < MAX_TREE_DEPTH) {
      if (ancestorId === draggedPageId) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "A page can't be moved under one of its own sub-pages.",
        });
        return;
      }
      ancestorId = getPageById(ancestorId)?.parent;
      depth++;
    }
    try {
      await projectPageService.update(workspaceSlug.toString(), projectId.toString(), draggedPageId, {
        parent: targetPageId,
      });
      draggedPage.mutateProperties({ parent: targetPageId });
      if (targetPageId) setExpandedPageIds((prev) => new Set(prev).add(targetPageId));
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "The page could not be moved. Please try again." });
    }
  };

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
          onMovePage={handleMovePage}
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
        </>
      )}
      <PageListSectionHeader title="All pages" onDropToRoot={(draggedPageId) => handleMovePage(draggedPageId, null)} />
      {renderTree(rootPageIds, 0)}
    </ListLayout>
  );
});
