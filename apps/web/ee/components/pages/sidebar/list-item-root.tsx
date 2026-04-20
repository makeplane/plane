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

import { useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { Transition } from "@headlessui/react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { createRoot } from "react-dom/client";
import { Loader } from "lucide-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon, PlusIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { EPageAccess } from "@plane/types";
import type { TPageDragPayload, TPageNavigationTabs } from "@plane/types";
import { DropIndicator } from "@plane/ui";
import { cn, getPageName } from "@plane/utils";
import { useAppRouter } from "@/hooks/use-app-router";
import { EPageStoreType, useCollection, usePage, usePageStore } from "@/plane-web/hooks/store";
import { WikiPageSidebarListItem } from "./list-item";

type Props = {
  paddingLeft: number;
  pageId: string;
  getChildPageIds?: (pageId: string) => string[];
  expandedPageIds?: string[];
  setExpandedPageIds?: React.Dispatch<React.SetStateAction<string[]>>;
  sectionType?: TPageNavigationTabs;
  collectionId?: string;
  handleReorderPages?: (pageId: string, targetId: string, position: "before" | "after") => void;
  isLastChild: boolean;
};

const scrollSidebarItemIntoView = (element: HTMLDivElement) => {
  const container = element.closest(".vertical-scrollbar");
  if (!(container instanceof HTMLElement)) return;

  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const isInView = elementRect.top >= containerRect.top + 40 && elementRect.bottom <= containerRect.bottom - 40;

  if (!isInView) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
};

export const WikiPageSidebarListItemRoot = observer(function WikiPageSidebarListItemRoot(props: Props) {
  const {
    paddingLeft,
    pageId,
    getChildPageIds,
    expandedPageIds = [],
    setExpandedPageIds,
    sectionType,
    collectionId,
    handleReorderPages,
    isLastChild,
  } = props;

  const [localIsExpanded, setLocalIsExpanded] = useState(false);
  const [subPagesLoaded, setSubPagesLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [dropIndicatorEdge, setDropIndicatorEdge] = useState<Edge | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  const listItemRef = useRef<HTMLDivElement>(null);
  const router = useAppRouter();
  const { workspaceSlug, pageId: currentPageIdParam } = useParams();
  const currentWorkspaceSlug = workspaceSlug?.toString();
  const currentPageId = currentPageIdParam?.toString();

  const collectionStore = useCollection();
  const { getPageById, createPage, isNestedPagesEnabled } = usePageStore(EPageStoreType.WORKSPACE);
  const page = usePage({
    pageId,
    storeType: EPageStoreType.WORKSPACE,
  });

  const resolvedSubPageIds = getChildPageIds ? getChildPageIds(pageId) : page?.subPageIds;
  const expectedSubPagesCount = page?.sub_pages_count ?? 0;
  const loadedSubPageIdsCount = resolvedSubPageIds?.length ?? 0;
  const hasLoadedAllSubPages = expectedSubPagesCount > 0 && loadedSubPageIdsCount >= expectedSubPagesCount;
  const collectionBranchState = collectionId
    ? collectionStore.getCollectionBranchState(collectionId, { parentId: pageId })
    : undefined;
  const shouldRefetchCollectionBranch =
    !!collectionId && (!collectionBranchState?.isLoaded || collectionBranchState.isStale);
  const currentPage = currentPageId ? getPageById(currentPageId) : undefined;
  const isActivePage = currentPageId === pageId;
  const isActiveBranch = !!(isActivePage || currentPage?.parentPageIds?.includes(pageId));
  const isExpanded = setExpandedPageIds ? expandedPageIds.includes(pageId) : localIsExpanded;
  const shouldShowSubPages = !isDragging && isExpanded && expectedSubPagesCount > 0;
  const canShowAddButton = !!(
    page?.canCurrentUserEditPage &&
    page?.isContentEditable &&
    currentWorkspaceSlug &&
    isNestedPagesEnabled(currentWorkspaceSlug)
  );

  useEffect(() => {
    const element = listItemRef.current;
    if (!isActivePage || !element) return;

    const timer = setTimeout(() => {
      if (listItemRef.current) {
        scrollSidebarItemIntoView(listItemRef.current);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isActivePage]);

  const handleItemMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleItemMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleSubPagesLoaded = useCallback(() => {
    setSubPagesLoaded(true);
  }, []);

  const getChildrenPageIds = useCallback(
    (parentId: string): string[] => {
      const children: string[] = [];

      const collectChildren = (id: string) => {
        const currentPage = getPageById(id);
        if (!currentPage) return;

        const subPageIds = getChildPageIds ? getChildPageIds(id) : (currentPage.subPageIds ?? []);
        subPageIds.forEach((childId) => {
          children.push(childId);
          collectChildren(childId);
        });
      };

      collectChildren(parentId);
      return children;
    },
    [getChildPageIds, getPageById]
  );

  const handleToggleExpanded = useCallback(() => {
    if (setExpandedPageIds) {
      setExpandedPageIds((previousPageIds) => {
        const nextExpandedPageIds = new Set(previousPageIds);

        if (nextExpandedPageIds.has(pageId)) {
          getChildrenPageIds(pageId).forEach((childPageId) => nextExpandedPageIds.delete(childPageId));
          nextExpandedPageIds.delete(pageId);
        } else {
          nextExpandedPageIds.add(pageId);
        }

        return [...nextExpandedPageIds];
      });
      return;
    }

    setLocalIsExpanded((previous) => !previous);
  }, [getChildrenPageIds, pageId, setExpandedPageIds]);

  const expandPage = useCallback(() => {
    if (setExpandedPageIds) {
      setExpandedPageIds((previousPageIds) =>
        previousPageIds.includes(pageId) ? previousPageIds : [...previousPageIds, pageId]
      );
      return;
    }

    setLocalIsExpanded(true);
  }, [pageId, setExpandedPageIds]);

  const handlePromotePageToRootAndReorder = useCallback(
    async (droppedPageId: string, position: "before" | "after") => {
      if (!collectionId || !currentWorkspaceSlug) return;

      await collectionStore.movePageWithCollectionContext({
        pageId: droppedPageId,
        sourceCollectionId: collectionId,
        targetCollectionId: collectionId,
        targetParentId: null,
        reorderTargetPageId: pageId,
        reorderPosition: position,
      });
    },
    [collectionId, collectionStore, currentWorkspaceSlug, pageId]
  );

  const handleMoveAcrossCollectionsAndReorder = useCallback(
    async (payload: TPageDragPayload, position: "before" | "after") => {
      if (!collectionId || !page?.id) return;

      await collectionStore.movePageWithCollectionContext({
        pageId: payload.id,
        sourceCollectionId: payload.collectionId,
        targetCollectionId: collectionId,
        targetParentId: page.parent_id ?? null,
        reorderTargetPageId: page.id,
        reorderPosition: position,
      });
    },
    [collectionId, collectionStore, page]
  );

  const updateDropIndicatorEdge = useCallback(
    ({
      self,
      location,
      source,
    }: {
      self: { element: Element; data: Record<string, unknown> };
      location: { current: { dropTargets: Array<{ element?: Element }> } };
      source: { data: Record<string, unknown> };
    }) => {
      const sourceData = source.data as TPageDragPayload;
      if (sourceData.id === pageId) {
        setDropIndicatorEdge(null);
        return;
      }
      const isPrimaryDropTarget = location.current.dropTargets[0]?.element === self.element;
      setDropIndicatorEdge(isPrimaryDropTarget ? extractClosestEdge(self.data) : null);
    },
    [pageId]
  );

  useEffect(() => {
    if (collectionId) {
      if (collectionBranchState?.isLoaded && !collectionBranchState.isStale) {
        if (!subPagesLoaded) {
          setSubPagesLoaded(true);
        }
        return;
      }

      if (isActiveBranch && subPagesLoaded && shouldRefetchCollectionBranch) {
        setSubPagesLoaded(false);
      }
      return;
    }

    if (hasLoadedAllSubPages) {
      if (!subPagesLoaded) {
        setSubPagesLoaded(true);
      }
      return;
    }

    if (isActiveBranch && expectedSubPagesCount > loadedSubPageIdsCount && subPagesLoaded) {
      setSubPagesLoaded(false);
    }
  }, [
    collectionBranchState?.isLoaded,
    collectionBranchState?.isStale,
    collectionId,
    expectedSubPagesCount,
    hasLoadedAllSubPages,
    isActiveBranch,
    loadedSubPageIdsCount,
    shouldRefetchCollectionBranch,
    subPagesLoaded,
  ]);

  useEffect(() => {
    if (collectionId && !isActiveBranch) return;
    if (!isExpanded || !page?.id || expectedSubPagesCount <= 0) return;

    const shouldLoadChildren = collectionId ? shouldRefetchCollectionBranch : !subPagesLoaded && !hasLoadedAllSubPages;
    if (!shouldLoadChildren) return;

    let isCancelled = false;
    const currentPageId = page.id;

    void (async () => {
      try {
        if (collectionId && currentWorkspaceSlug) {
          await collectionStore.fetchCollectionBranchChildren(currentWorkspaceSlug, collectionId, currentPageId, {
            force: collectionBranchState?.isStale,
          });
        } else {
          await page.fetchSubPages();
        }

        if (!isCancelled) {
          setSubPagesLoaded(true);
        }
      } catch {
        // Manual expand already surfaces an error; silent retries keep auto-reveal resilient.
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [
    collectionBranchState?.isStale,
    collectionId,
    collectionStore,
    currentWorkspaceSlug,
    expectedSubPagesCount,
    hasLoadedAllSubPages,
    isActiveBranch,
    isExpanded,
    page,
    shouldRefetchCollectionBranch,
    subPagesLoaded,
  ]);

  const handleCreatePage = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      if (!page?.id) return;

      setIsCreatingPage(true);

      try {
        const parentPageId = page.id;
        const newPage = await createPage({
          name: "",
          parent_id: parentPageId,
          access: page.access,
        });

        if (newPage?.id && collectionId && currentWorkspaceSlug && collectionBranchState?.isLoaded) {
          void collectionStore.fetchCollectionBranchChildren(currentWorkspaceSlug, collectionId, parentPageId, {
            force: true,
          });
        }

        const pageUrl = newPage?.id ? getPageById(newPage.id)?.getRedirectionLink?.() : undefined;
        if (pageUrl) {
          router.push(pageUrl);
        }
      } catch (error) {
        console.error("Failed to create page:", error);
      } finally {
        setIsCreatingPage(false);
      }
    },
    [
      collectionBranchState?.isLoaded,
      collectionId,
      collectionStore,
      createPage,
      currentWorkspaceSlug,
      getPageById,
      page,
      router,
    ]
  );

  useEffect(() => {
    const element = listItemRef.current;
    if (!element || !page?.id) return;

    const currentPageId = page.id;
    const initialData: TPageDragPayload = {
      id: currentPageId,
      parentId: page.parent_id ?? null,
      collectionId: collectionId ?? null,
    };

    return combine(
      draggable({
        element,
        dragHandle: element,
        getInitialData: () => initialData,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({ x: "0px", y: "0px" }),
            render: ({ container }) => {
              const root = createRoot(container);
              root.render(
                <div className="w-[225px] flex items-center gap-1 py-1.5 truncate rounded-md bg-layer-1 text-secondary opacity-40">
                  <div className="grid size-4 flex-shrink-0 place-items-center">
                    <span className="grid place-items-center">
                      {page.logo_props?.in_use ? (
                        <Logo logo={page.logo_props} size={14} type="lucide" />
                      ) : (
                        <PageIcon className="size-3.5" />
                      )}
                    </span>
                  </div>
                  <p className="min-w-0 flex-grow truncate text-13">{getPageName(page.name)}</p>
                </div>
              );
              return () => root.unmount();
            },
            nativeSetDragImage,
          });
        },
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
        canDrag: () =>
          collectionId
            ? collectionStore.canCurrentUserReorderPageInCollection(currentPageId, collectionId)
            : page.canCurrentUserEditPage &&
              page.isContentEditable &&
              !!currentWorkspaceSlug &&
              isNestedPagesEnabled(currentWorkspaceSlug) &&
              !page.archived_at &&
              (!page.is_shared || page.isCurrentUserOwner),
      }),
      dropTargetForElements({
        element,
        getData: ({ input, element: dropElement }) =>
          attachClosestEdge(initialData, {
            element: dropElement,
            input,
            allowedEdges: ["top", "bottom"],
          }),
        onDragEnter: ({ self, location, source }) => {
          updateDropIndicatorEdge({ self, location, source });
        },
        onDrag: ({ self, location, source }) => {
          updateDropIndicatorEdge({ self, location, source });
        },
        onDragLeave: () => {
          setDropIndicatorEdge(null);
        },
        onDrop: ({ location, self, source }) => {
          setDropIndicatorEdge(null);

          if (location.current.dropTargets[0]?.element !== self.element) return;

          const sourceData = source.data as TPageDragPayload;
          if (sourceData.id === pageId) return;

          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;

          const position = closestEdge === "top" ? "before" : "after";

          if (collectionId && sourceData.collectionId !== collectionId) {
            void handleMoveAcrossCollectionsAndReorder(sourceData, position);
            return;
          }

          if (
            collectionId &&
            sourceData.collectionId === collectionId &&
            sourceData.parentId !== (page.parent_id ?? null) &&
            (page.parent_id ?? null) === null &&
            sourceData.parentId
          ) {
            void handlePromotePageToRootAndReorder(sourceData.id, position);
            return;
          }

          handleReorderPages?.(sourceData.id, pageId, position);
        },
        canDrop: ({ source }) => {
          if (isDropping || !currentWorkspaceSlug || !isNestedPagesEnabled(currentWorkspaceSlug)) {
            return false;
          }

          if (sectionType === "shared" || sectionType === "archived") return false;

          const sourceData = source.data as TPageDragPayload;
          const droppedPageId = sourceData.id;
          if (!droppedPageId) return false;

          if (collectionId && sourceData.collectionId !== collectionId) {
            return collectionStore.canCurrentUserAddPageToCollection(droppedPageId);
          }

          const sourcePage = getPageById(droppedPageId);
          if (!sourcePage) return false;
          if (collectionId && sourcePage.access !== EPageAccess.PUBLIC) return false;

          return true;
        },
      })
    );
  }, [
    collectionId,
    collectionStore,
    currentWorkspaceSlug,
    getPageById,
    handleMoveAcrossCollectionsAndReorder,
    handlePromotePageToRootAndReorder,
    handleReorderPages,
    isDropping,
    isNestedPagesEnabled,
    page,
    pageId,
    sectionType,
    updateDropIndicatorEdge,
  ]);

  if (!page) return null;
  if (page.archived_at && sectionType !== "archived") return null;

  return (
    <div
      ref={listItemRef}
      className={cn("outline-none rounded-md transition-colors", {
        "is-dragging": isDropping,
      })}
    >
      <DropIndicator
        classNames={cn({
          "is-reordering": dropIndicatorEdge === "top",
        })}
        isVisible={dropIndicatorEdge === "top" && !isDropping}
      />
      <div
        className={cn("relative", {
          "opacity-30": isDragging,
        })}
        onMouseEnter={handleItemMouseEnter}
        onMouseLeave={handleItemMouseLeave}
      >
        <WikiPageSidebarListItem
          handleToggleExpanded={handleToggleExpanded}
          onSubPagesLoaded={handleSubPagesLoaded}
          expandPage={expandPage}
          isDragging={isDragging}
          isExpanded={isExpanded}
          paddingLeft={paddingLeft}
          pageId={pageId}
          isHovered={isHovered}
          canShowAddButton={canShowAddButton}
          sectionType={sectionType}
          collectionId={collectionId}
          onDropTargetChange={setIsDropping}
        />
        {isHovered && canShowAddButton && (
          <IconButton
            variant="ghost"
            size="sm"
            icon={isCreatingPage ? Loader : PlusIcon}
            iconClassName={isCreatingPage ? "animate-spin" : undefined}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 transition-all duration-200 ease-in-out"
            onClick={(event) => void handleCreatePage(event)}
            data-prevent-progress
            disabled={isCreatingPage}
          />
        )}
      </div>
      {shouldShowSubPages && (
        <Transition
          show={isExpanded}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="mt-0.5 space-y-0.5">
            {resolvedSubPageIds?.map((subPageId, index) => (
              <WikiPageSidebarListItemRoot
                key={subPageId}
                paddingLeft={paddingLeft + 16}
                pageId={subPageId}
                getChildPageIds={getChildPageIds}
                expandedPageIds={expandedPageIds}
                setExpandedPageIds={setExpandedPageIds}
                sectionType={sectionType}
                collectionId={collectionId}
                handleReorderPages={handleReorderPages}
                isLastChild={index === resolvedSubPageIds.length - 1}
              />
            ))}
            {isLastChild && (
              <DropIndicator
                classNames={cn({
                  "is-reordering": dropIndicatorEdge === "bottom",
                })}
                isVisible={dropIndicatorEdge === "bottom" && !isDropping}
              />
            )}
          </div>
        </Transition>
      )}
    </div>
  );
});
