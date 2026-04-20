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
import type { ReactNode } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Loader } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EPageAccess } from "@plane/types";
import type { TPageDragPayload } from "@plane/types";
import { cn } from "@plane/utils";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { COLLECTION_SWR_OPTIONS, collectionPagesKey } from "../../collection/swr";
import { EPageStoreType, useCollection, usePageStore } from "@/plane-web/hooks/store";
import { WikiPageSidebarListItemRoot } from "../list-item-root";

type TBaseCollectionItemProps = {
  collectionId: string;
  workspaceSlug: string;
  isCollectionActive: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  actions?: ReactNode;
};

const BaseCollectionItemContent = observer(function BaseCollectionItemContent(props: TBaseCollectionItemProps) {
  const { collectionId, workspaceSlug, isCollectionActive, label, icon, onClick, actions } = props;
  const { pageId: currentPageIdParam } = useParams();
  const collectionStore = useCollection();
  const pageStore = usePageStore(EPageStoreType.WORKSPACE);
  const { t } = useTranslation();
  const [isHovering, setIsHovering] = useState(false);
  const [isPageDropTarget, setIsPageDropTarget] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const [sidebarScrollContainer, setSidebarScrollContainer] = useState<HTMLDivElement | null>(null);
  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);
  const isExpanded = collectionStore.isCollectionExpanded(collectionId);
  const currentPageId = currentPageIdParam?.toString();
  const manualExpandedPageIds = [...collectionStore.getCollectionSidebarExpandedRowIds(collectionId)];
  const autoExpandedPageIds = collectionStore.getCollectionAutoExpandedAncestorIds(collectionId, currentPageId);
  const isCurrentPageExplicitlyInCollection =
    !!currentPageId && collectionStore.getExplicitCollectionIdForPage(currentPageId) === collectionId;
  const expandedPageIds = [...new Set([...manualExpandedPageIds, ...autoExpandedPageIds])];
  const setExpandedPageIds = useCallback<React.Dispatch<React.SetStateAction<string[]>>>(
    (value) => {
      const previousPageIds = [...collectionStore.getCollectionSidebarExpandedRowIds(collectionId)];
      const nextPageIds = typeof value === "function" ? value(previousPageIds) : value;
      collectionStore.replaceCollectionSidebarExpandedRowIds(collectionId, nextPageIds);
    },
    [collectionId, collectionStore]
  );

  const handleReorderPages = useCallback(
    (pageId: string, targetPageId: string, position: "before" | "after") => {
      const targetPage = pageStore.getPageById(targetPageId);
      if (!targetPage?.id) return;

      void collectionStore.movePageWithCollectionContext({
        pageId,
        sourceCollectionId: collectionId,
        targetCollectionId: collectionId,
        targetParentId: targetPage.parent_id ?? null,
        reorderTargetPageId: targetPageId,
        reorderPosition: position,
      });
    },
    [collectionId, collectionStore, pageStore]
  );

  const handleCollectionNavigate = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (isCollectionActive) {
        collectionStore.toggleCollectionExpanded(collectionId);
        return;
      }

      onClick();
    },
    [collectionId, collectionStore, isCollectionActive, onClick]
  );

  const handleCollectionKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        handleCollectionNavigate(event);
      }
    },
    [handleCollectionNavigate]
  );

  useEffect(() => {
    setSidebarScrollContainer(rowRef.current?.closest(".vertical-scrollbar") as HTMLDivElement | null);
  }, []);

  useEffect(() => {
    if (!isCollectionActive && !isCurrentPageExplicitlyInCollection) return;

    collectionStore.setCollectionExpanded(collectionId);
  }, [collectionId, collectionStore, isCollectionActive, isCurrentPageExplicitlyInCollection]);

  const { isLoading: isLoadingCollectionPages } = useSWR(
    isExpanded ? collectionPagesKey(workspaceSlug, collectionId) : null,
    () => collectionStore.fetchCollectionPages(workspaceSlug, collectionId, { force: true }),
    COLLECTION_SWR_OPTIONS
  );
  const rootBranchState = collectionStore.getCollectionBranchState(collectionId, { parentId: null });

  const rootPageIds = collectionStore.getCollectionRootPageIds(collectionId, {});
  const showChevron = isExpanded || isHovering;
  const lastRootPageId = rootPageIds.at(-1);
  const handlePromotePageToRoot = useCallback(
    async (payload: TPageDragPayload) => {
      try {
        await collectionStore.movePageWithCollectionContext({
          pageId: payload.id,
          sourceCollectionId: payload.collectionId,
          targetCollectionId: collectionId,
          targetParentId: null,
          reorderTargetPageId: lastRootPageId && lastRootPageId !== payload.id ? lastRootPageId : undefined,
          reorderPosition: lastRootPageId && lastRootPageId !== payload.id ? "after" : undefined,
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error.label"),
          message: t("page_actions.move_page.toasts.error.message"),
        });
      }
    },
    [collectionId, collectionStore, lastRootPageId, t]
  );

  const fetchNextPage = useCallback(() => {
    if (!rootBranchState?.nextCursor || !rootBranchState.hasNextPage || rootBranchState.isLoading) {
      return;
    }

    void collectionStore.fetchCollectionPages(workspaceSlug, collectionId, {
      cursor: rootBranchState.nextCursor,
    });
  }, [
    collectionId,
    collectionStore,
    rootBranchState?.hasNextPage,
    rootBranchState?.isLoading,
    rootBranchState?.nextCursor,
    workspaceSlug,
  ]);

  useIntersectionObserver(
    sidebarScrollContainer,
    rootBranchState?.isLoading ? null : intersectionElement,
    fetchNextPage,
    "100% 0% 100% 0%"
  );

  useEffect(() => {
    const element = rowRef.current;
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

        if (payload.collectionId === collectionId) {
          if (!payload.parentId) return;

          void handlePromotePageToRoot(payload);
          return;
        }

        void (async () => {
          try {
            await collectionStore.movePageWithCollectionContext({
              pageId: payload.id,
              sourceCollectionId: payload.collectionId,
              targetCollectionId: collectionId,
              targetParentId: null,
            });
          } catch {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("common.error.label"),
              message: t("page_actions.move_page.toasts.error.message"),
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

        if (payload.collectionId === collectionId) {
          return !!payload.parentId && collectionStore.canCurrentUserReorderPageInCollection(payload.id, collectionId);
        }

        return collectionStore.canCurrentUserAddPageToCollection(payload.id);
      },
    });
  }, [collectionId, collectionStore, handlePromotePageToRoot, pageStore, t, workspaceSlug]);

  return (
    <div>
      <div
        ref={rowRef}
        className={cn(
          "group/collection-item flex h-8 w-full items-center justify-between gap-1.5 rounded-md text-secondary transition-colors hover:bg-layer-transparent-hover focus-within:bg-layer-transparent-active",
          {
            "bg-layer-transparent-active text-primary hover:bg-layer-transparent-active focus-within:bg-layer-transparent-active":
              isCollectionActive,
            "bg-layer-1": isPageDropTarget && !isCollectionActive,
            "pr-2": !!actions,
          }
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 truncate pr-1"
          style={{ paddingLeft: "4px" }}
          role="button"
          tabIndex={0}
          onClick={handleCollectionNavigate}
          onKeyDown={handleCollectionKeyDown}
          aria-current={isCollectionActive ? "page" : undefined}
          aria-expanded={isExpanded}
        >
          <div className="grid size-5 shrink-0 place-items-center">
            {isLoadingCollectionPages ? (
              <span className="grid size-4 place-items-center">
                <Loader className="size-3.5 animate-spin" />
              </span>
            ) : showChevron ? (
              <button
                type="button"
                className="grid size-4 place-items-center rounded-sm hover:bg-layer-transparent-hover"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  collectionStore.toggleCollectionExpanded(collectionId);
                }}
                aria-label={
                  isExpanded
                    ? t("wiki_collections.sidebar.collapse_collection")
                    : t("wiki_collections.sidebar.expand_collection")
                }
              >
                <ChevronRightIcon
                  className={cn("size-3.5 transform transition-transform duration-300 ease-in-out", {
                    "rotate-90": isExpanded,
                  })}
                  strokeWidth={2.5}
                />
              </button>
            ) : (
              <span className="grid place-items-center">{icon}</span>
            )}
          </div>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-13 leading-5">{label}</span>
          </span>
        </div>

        {actions && (
          <div
            className={cn(
              "flex shrink-0 items-center gap-0.5 leading-none transition-opacity group-focus-within/collection-item:opacity-100",
              {
                "pointer-events-none opacity-0": !isHovering,
              }
            )}
          >
            {actions}
          </div>
        )}
      </div>

      {isExpanded && (
        <div>
          {isLoadingCollectionPages && rootPageIds.length === 0 && (
            <div className="flex items-center gap-2 py-1.5 pl-11 text-12 text-tertiary">
              <Loader className="size-3 animate-spin" />
              <span>{t("wiki_collections.sidebar.loading_pages")}</span>
            </div>
          )}
          {rootPageIds.length > 0 && (
            <div className="mt-0.5 space-y-0.5">
              {rootPageIds.map((pageId, index) => (
                <WikiPageSidebarListItemRoot
                  key={pageId}
                  paddingLeft={16}
                  pageId={pageId}
                  collectionId={collectionId}
                  getChildPageIds={(currentPageId) =>
                    collectionStore.getCollectionChildPageIds(currentPageId, collectionId)
                  }
                  expandedPageIds={expandedPageIds}
                  setExpandedPageIds={setExpandedPageIds}
                  handleReorderPages={handleReorderPages}
                  isLastChild={index === rootPageIds.length - 1}
                />
              ))}
            </div>
          )}
          {rootBranchState?.hasNextPage && <div ref={setIntersectionElement} className="h-4 w-full" />}
        </div>
      )}
    </div>
  );
});

export const BaseCollectionItem = memo(BaseCollectionItemContent);
