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

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Book, ChevronRight, Loader } from "lucide-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EPageAccess } from "@plane/types";
import type { TCollection, TLogoProps, TPageDragPayload } from "@plane/types";
import { cn } from "@plane/utils";
import { useAppRouter } from "@/hooks/use-app-router";
import { useCollection, EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { CollectionContextMenu } from "../collection";
import { CollectionAddPageMenu } from "./collection-add-page-menu";
import { WikiPageSidebarListItemRoot } from "../list-item-root";

type TCollectionItemProps = {
  collection: TCollection;
  workspaceSlug: string;
  isCollectionActive: boolean;
  isMembershipsLoading: boolean;
  onOpenAddExistingPage: (collectionId: string) => void;
};

const CollectionItemContent = observer(function CollectionItemContent(props: TCollectionItemProps) {
  const { collection, workspaceSlug, isCollectionActive, isMembershipsLoading, onOpenAddExistingPage } = props;
  const router = useAppRouter();
  const { pageId: currentPageIdParam } = useParams();
  const collectionStore = useCollection();
  const pageStore = usePageStore(EPageStoreType.WORKSPACE);
  const [isHovering, setIsHovering] = useState(false);
  const [isPageDropTarget, setIsPageDropTarget] = useState(false);
  const collectionRowRef = useRef<HTMLDivElement>(null);
  const collectionLogoProps = collection.logo_props as TLogoProps | undefined;
  const isExpanded = collectionStore.isCollectionExpanded(collection.id);
  const currentPageId = currentPageIdParam?.toString();
  const manualExpandedPageIds = [...collectionStore.getCollectionSidebarExpandedRowIds(collection.id)];
  const autoExpandedPageIds = collectionStore.getCollectionAutoExpandedAncestorIds(collection.id, currentPageId);
  const isCurrentPageInCollection =
    !!currentPageId && collectionStore.getEffectiveCollectionId(currentPageId) === collection.id;
  const expandedPageIds = [...new Set([...manualExpandedPageIds, ...autoExpandedPageIds])];
  const setExpandedPageIds = useCallback<React.Dispatch<React.SetStateAction<string[]>>>(
    (value) => {
      const previousPageIds = [...collectionStore.getCollectionSidebarExpandedRowIds(collection.id)];
      const nextPageIds = typeof value === "function" ? value(previousPageIds) : value;
      collectionStore.replaceCollectionSidebarExpandedRowIds(collection.id, nextPageIds);
    },
    [collection.id, collectionStore]
  );

  const handleReorderPages = useCallback(
    (pageId: string, targetPageId: string, position: "before" | "after") => {
      const targetPage = pageStore.getPageById(targetPageId);
      if (!targetPage?.id) return;

      void collectionStore.movePageWithCollectionContext({
        pageId,
        sourceCollectionId: collection.id,
        targetCollectionId: collection.id,
        targetParentId: targetPage.parent_id ?? null,
        reorderTargetPageId: targetPageId,
        reorderPosition: position,
      });
    },
    [collection.id, collectionStore, pageStore]
  );

  useEffect(() => {
    if (isCollectionActive) {
      collectionStore.setCollectionExpanded(collection.id);
    }
  }, [collection.id, collectionStore, isCollectionActive]);

  useEffect(() => {
    if (!isCurrentPageInCollection) return;

    collectionStore.setCollectionExpanded(collection.id);
  }, [collection.id, collectionStore, isCurrentPageInCollection]);

  const { isLoading: isLoadingCollectionPages } = useSWR(
    isExpanded ? ["custom-collection-pages", workspaceSlug, collection.id] : null,
    () => collectionStore.fetchCollectionPages(workspaceSlug, collection.id),
    { revalidateOnFocus: false }
  );

  const rootPageIds = collectionStore.getCollectionRootPageIds(collection.id, {});
  const hasLoadedCollectionPages = collectionStore.pageCollectionIdsByCollection.has(collection.id);
  const hasKnownPages = collectionStore.getCollectionViewPageIds(collection.id).size > 0;
  const showChevron = (hasKnownPages || !hasLoadedCollectionPages) && isHovering;
  const lastRootPageId = rootPageIds.at(-1);
  const handlePromotePageToRoot = useCallback(
    async (payload: TPageDragPayload) => {
      try {
        await collectionStore.movePageWithCollectionContext({
          pageId: payload.id,
          sourceCollectionId: payload.collectionId,
          targetCollectionId: collection.id,
          targetParentId: null,
          reorderTargetPageId: lastRootPageId && lastRootPageId !== payload.id ? lastRootPageId : undefined,
          reorderPosition: lastRootPageId && lastRootPageId !== payload.id ? "after" : undefined,
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to move page. Please try again.",
        });
      }
    },
    [collection.id, collectionStore, lastRootPageId]
  );

  useEffect(() => {
    const element = collectionRowRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      onDragEnter: () => setIsPageDropTarget(true),
      onDragLeave: () => setIsPageDropTarget(false),
      onDrop: ({ location, self, source }) => {
        setIsPageDropTarget(false);
        if (location.current.dropTargets[0]?.element !== self.element) return;

        const payload = source.data as TPageDragPayload;
        if (!payload.id) return;

        if (payload.collectionId === collection.id) {
          if (!payload.parentId) return;

          void handlePromotePageToRoot(payload);
          return;
        }

        void (async () => {
          try {
            await collectionStore.movePageWithCollectionContext({
              pageId: payload.id,
              sourceCollectionId: payload.collectionId,
              targetCollectionId: collection.id,
              targetParentId: null,
            });
          } catch {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Failed to move page. Please try again.",
            });
          }
        })();
      },
      canDrop: ({ source }) => {
        const payload = source.data as TPageDragPayload;
        if (!payload.id) return false;

        if (!pageStore.isNestedPagesEnabled(workspaceSlug)) return false;

        const sourcePage = pageStore.getPageById(payload.id);
        if (sourcePage?.is_shared || !!sourcePage?.archived_at || sourcePage?.access !== EPageAccess.PUBLIC)
          return false;

        if (payload.collectionId === collection.id) {
          return !!payload.parentId && collectionStore.canCurrentUserReorderPageInCollection(payload.id, collection.id);
        }

        return collectionStore.canCurrentUserAddPageToCollection(payload.id);
      },
    });
  }, [collection.id, collectionStore, handlePromotePageToRoot, pageStore, workspaceSlug]);

  return (
    <div>
      <div
        ref={collectionRowRef}
        className={cn(
          "group/collection-item flex w-full items-center justify-between gap-1 rounded-md py-1.5 text-secondary transition-colors hover:bg-layer-transparent-hover focus-within:bg-layer-transparent-active",
          {
            "bg-layer-transparent-hover": isPageDropTarget && !isCollectionActive,
            "bg-accent-primary/10 font-medium text-accent-primary hover:bg-accent-primary/10": isCollectionActive,
          }
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="flex w-full items-center gap-1 truncate px-1">
          <div className="grid size-4 flex-shrink-0 place-items-center">
            {isLoadingCollectionPages ? (
              <Loader className="size-3.5 animate-spin" />
            ) : showChevron ? (
              <button
                type="button"
                className="grid size-4 place-items-center rounded-sm hover:bg-layer-transparent-hover"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  collectionStore.toggleCollectionExpanded(collection.id);
                }}
                aria-label={isExpanded ? "Collapse collection" : "Expand collection"}
              >
                <ChevronRight
                  className={cn("size-3.5 transition-transform duration-200", {
                    "rotate-90": isExpanded,
                  })}
                />
              </button>
            ) : (
              <span className="grid size-4 place-items-center rounded-md bg-surface-2">
                {collectionLogoProps?.in_use ? (
                  <Logo logo={collectionLogoProps} size={12} type="lucide" />
                ) : (
                  <Book className="size-3 flex-shrink-0 text-tertiary" />
                )}
              </span>
            )}
          </div>
          <button
            type="button"
            className="min-w-0 flex-1 cursor-pointer truncate text-left"
            onClick={() => router.push(`/${workspaceSlug}/wiki/collections/${collection.id}`)}
          >
            <p className="min-w-0 truncate text-13">{collection.name}</p>
          </button>
        </div>

        <div className="flex items-center justify-end pr-1 leading-none">
          <div
            className={cn(
              "flex items-center gap-0.5 leading-none transition-opacity group-focus-within/collection-item:opacity-100",
              {
                "pointer-events-none opacity-0": !isHovering,
              }
            )}
          >
            <CollectionAddPageMenu
              workspaceSlug={workspaceSlug}
              targetCollectionId={collection.id}
              showAddExisting
              onOpenAddExisting={() => onOpenAddExistingPage(collection.id)}
              buttonType="icon"
            />
            <CollectionContextMenu collection={collection} workspaceSlug={workspaceSlug} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div>
          {(isLoadingCollectionPages || isMembershipsLoading) && rootPageIds.length === 0 && (
            <div className="flex items-center gap-2 py-1.5 pl-7 text-12 text-tertiary">
              <Loader className="size-3 animate-spin" />
              <span>Loading pages...</span>
            </div>
          )}
          {!isMembershipsLoading &&
            !isLoadingCollectionPages &&
            hasLoadedCollectionPages &&
            rootPageIds.length === 0 && (
              <div className="py-1.5 pl-7 text-12 text-tertiary">No pages in this collection</div>
            )}
          {rootPageIds.map((pageId, index) => (
            <WikiPageSidebarListItemRoot
              key={pageId}
              paddingLeft={12}
              pageId={pageId}
              collectionId={collection.id}
              getChildPageIds={(currentPageId) =>
                collectionStore.getCollectionChildPageIds(currentPageId, collection.id)
              }
              expandedPageIds={expandedPageIds}
              setExpandedPageIds={setExpandedPageIds}
              handleReorderPages={handleReorderPages}
              isLastChild={index === rootPageIds.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export const CollectionItem = memo(CollectionItemContent);
