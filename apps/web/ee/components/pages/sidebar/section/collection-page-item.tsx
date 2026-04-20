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

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRight, Loader } from "lucide-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon, RestrictedPageIcon } from "@plane/propel/icons";
import type { TPage } from "@plane/types";
import { cn } from "@plane/utils";
import { useAppRouter } from "@/hooks/use-app-router";
import { EPageStoreType, useCollection, usePageStore } from "@/plane-web/hooks/store";

export type TCollectionSidebarPage = Pick<
  TPage,
  "id" | "name" | "logo_props" | "parent_id" | "sort_order" | "sub_pages_count"
> & { id: string; collection_sort_order?: number | null };

type Props = {
  collectionId: string;
  page: TCollectionSidebarPage;
  childrenByParent: Map<string, TCollectionSidebarPage[]>;
  depth?: number;
};

const getDescendantIds = (
  pageId: string,
  childrenByParent: Map<string, TCollectionSidebarPage[]>,
  visited = new Set<string>()
) => {
  const childPages = childrenByParent.get(pageId) ?? [];

  childPages.forEach((childPage) => {
    if (visited.has(childPage.id)) return;
    visited.add(childPage.id);
    getDescendantIds(childPage.id, childrenByParent, visited);
  });

  return visited;
};

export const CollectionPageItem = observer(function CollectionPageItem({
  collectionId,
  page,
  childrenByParent,
  depth = 0,
}: Props) {
  const { workspaceSlug, pageId: currentPageId } = useParams();
  const router = useAppRouter();
  const collectionStore = useCollection();
  const pageStore = usePageStore(EPageStoreType.WORKSPACE);
  const pageInstance = pageStore.getPageById(page.id);
  const [isHovering, setIsHovering] = useState(false);
  const [isFetchingSubPages, setIsFetchingSubPages] = useState(false);

  const canCurrentUserAccessPage = pageInstance?.canCurrentUserAccessPage ?? true;
  const displayName = canCurrentUserAccessPage ? pageInstance?.name || page.name || "Untitled" : "Restricted Access";
  const displayLogo = pageInstance?.logo_props || page.logo_props;
  const childPages = useMemo(
    () =>
      [...(childrenByParent.get(page.id) ?? [])].sort(
        (a, b) => (a.collection_sort_order ?? a.sort_order ?? 0) - (b.collection_sort_order ?? b.sort_order ?? 0)
      ),
    [childrenByParent, page.id]
  );
  const fallbackChildPages = useMemo(() => {
    if (childPages.length > 0) return childPages;

    const subPageIds = pageInstance?.subPageIds ?? [];
    return subPageIds
      .map((subPageId) => pageStore.getPageById(subPageId))
      .filter(
        (subPage): subPage is NonNullable<typeof subPage> =>
          !!subPage?.id && !subPage.archived_at && !subPage.deleted_at
      )
      .map((subPage) => ({
        id: subPage.id as string,
        name: subPage.name,
        logo_props: subPage.logo_props,
        parent_id: subPage.parent_id,
        sort_order: subPage.sort_order,
        sub_pages_count: subPage.sub_pages_count,
      }))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [childPages, pageInstance?.subPageIds, pageStore]);
  const displayChildPages = childPages.length > 0 ? childPages : fallbackChildPages;
  const loadedChildrenCount = displayChildPages.length;
  const subPagesCount = pageInstance?.sub_pages_count ?? page.sub_pages_count ?? 0;
  const hasChildren = loadedChildrenCount > 0 || subPagesCount > 0;
  const resolvedCurrentPageId = currentPageId?.toString();
  const currentPageInstance = resolvedCurrentPageId ? pageStore.getPageById(resolvedCurrentPageId) : undefined;
  const isActiveBranch = useMemo(() => {
    if (!resolvedCurrentPageId) return false;
    if (resolvedCurrentPageId === page.id) return true;
    if (currentPageInstance?.parentPageIds?.includes(page.id)) return true;
    return getDescendantIds(page.id, childrenByParent).has(resolvedCurrentPageId);
  }, [childrenByParent, currentPageInstance?.parentPageIds, page.id, resolvedCurrentPageId]);
  const isExpanded = collectionStore.isCollectionSidebarRowExpanded(collectionId, page.id);
  const showChevron = hasChildren && isHovering;

  useEffect(() => {
    if (isActiveBranch) {
      collectionStore.setCollectionSidebarRowExpanded(collectionId, page.id);
    }
  }, [collectionId, collectionStore, isActiveBranch, page.id]);

  const isPageActive = useMemo(() => currentPageId?.toString() === page.id, [currentPageId, page.id]);

  const handleSubPagesToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!hasChildren) return;

    const shouldExpand = !isExpanded;
    collectionStore.toggleCollectionSidebarExpandedRow(collectionId, page.id);
    if (!shouldExpand) return;

    const loadedSubPageIdsCount = pageInstance?.subPageIds?.length ?? 0;

    if (subPagesCount > loadedSubPageIdsCount && pageInstance?.fetchSubPages) {
      setIsFetchingSubPages(true);
      try {
        await pageInstance.fetchSubPages();
      } finally {
        setIsFetchingSubPages(false);
      }
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex h-8 items-center rounded-md pr-2 text-13 text-secondary transition-colors hover:bg-layer-transparent-hover",
          {
            "bg-layer-transparent-active text-primary hover:bg-layer-transparent-active": isPageActive,
          }
        )}
        style={{ paddingLeft: `${28 + depth * 16}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="mr-1 size-4 flex-shrink-0 grid place-items-center">
          {isFetchingSubPages ? (
            <Loader className="size-3.5 animate-spin" />
          ) : showChevron ? (
            <button
              type="button"
              className="grid place-items-center rounded-sm hover:bg-layer-transparent-hover"
              onClick={(event) => void handleSubPagesToggle(event)}
              aria-label={isExpanded ? "Collapse page" : "Expand page"}
            >
              <ChevronRight
                className={cn("size-3.5 transition-transform duration-200", {
                  "rotate-90": isExpanded,
                })}
              />
            </button>
          ) : (
            <span className="grid place-items-center">
              {!canCurrentUserAccessPage ? (
                <RestrictedPageIcon className="size-3.5" />
              ) : displayLogo?.in_use ? (
                <Logo logo={displayLogo} size={12} type="lucide" />
              ) : (
                <PageIcon className="size-3.5" type="lucide" />
              )}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (!canCurrentUserAccessPage) return;
            router.push(`/${workspaceSlug}/wiki/${page.id}`);
          }}
          className={cn("flex min-w-0 flex-1 items-center gap-2 text-left", {
            "cursor-default": !canCurrentUserAccessPage,
          })}
          aria-disabled={!canCurrentUserAccessPage}
        >
          <span className="flex-1 truncate text-left leading-5">{displayName}</span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {isFetchingSubPages && displayChildPages.length === 0 && (
            <div
              className="flex items-center gap-2 py-1.5 text-12 text-tertiary"
              style={{ paddingLeft: `${44 + depth * 16}px` }}
            >
              <Loader className="size-3 animate-spin" />
              <span>Loading pages...</span>
            </div>
          )}
          {displayChildPages.map((childPage) => (
            <CollectionPageItem
              key={childPage.id}
              collectionId={collectionId}
              page={childPage}
              childrenByParent={childrenByParent}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});
