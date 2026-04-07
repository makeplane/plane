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
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { createRoot } from "react-dom/client";
import { Loader } from "lucide-react";
import { Transition } from "@headlessui/react";
// plane imports
import { PlusIcon, PageIcon } from "@plane/propel/icons";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { EPageAccess } from "@plane/types";
import type { TPageDragPayload, TPageNavigationTabs } from "@plane/types";
import { DropIndicator } from "@plane/ui";
import { cn, getPageName } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { EPageStoreType, useCollection, usePage, usePageStore } from "@/plane-web/hooks/store";
// local imports
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
  // states
  const [localIsExpanded, setLocalIsExpanded] = useState(false);
  const [subPagesLoaded, setSubPagesLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [dropIndicatorEdge, setDropIndicatorEdge] = useState<Edge | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // refs
  const listItemRef = useRef<HTMLDivElement>(null);
  const itemContentRef = useRef<HTMLDivElement>(null);
  // navigation
  const router = useAppRouter();
  const { workspaceSlug, pageId: currentPageIdParam } = useParams();
  // store hooks
  const collectionStore = useCollection();
  const { getPageById, createPage, isNestedPagesEnabled } = usePageStore(EPageStoreType.WORKSPACE);
  const page = usePage({
    pageId,
    storeType: EPageStoreType.WORKSPACE,
  });
  // derived values
  const { sub_pages_count, subPageIds } = page ?? {};
  const resolvedSubPageIds = getChildPageIds ? getChildPageIds(pageId) : subPageIds;
  const loadedSubPageIdsCount = resolvedSubPageIds?.length ?? 0;
  const expectedSubPagesCount = sub_pages_count ?? 0;
  const hasLoadedAllSubPages = expectedSubPagesCount > 0 && loadedSubPageIdsCount >= expectedSubPagesCount;
  const currentPage = currentPageIdParam ? getPageById(currentPageIdParam.toString()) : undefined;
  // check if this is the active page
  const isActivePage = currentPageIdParam && currentPageIdParam.toString() === pageId;
  // auto-scroll to active page when sidebar renders
  useEffect(() => {
    if (isActivePage && listItemRef.current) {
      // Wait a short delay to ensure sidebar is fully rendered
      const timer = setTimeout(() => {
        // Check if element is in view already
        const element = listItemRef.current;
        if (!element) return;

        const elementRect = element.getBoundingClientRect();

        // Get the container bounds (sidebar scroll container)
        const container = element.closest(".vertical-scrollbar");
        if (!container) return;

        const containerRect = container.getBoundingClientRect();

        // Only scroll if the element is outside the visible area with some padding
        const isInView =
          elementRect.top >= containerRect.top + 40 && // Element is below the top edge (with padding)
          elementRect.bottom <= containerRect.bottom - 40; // Element is above the bottom edge (with padding)

        if (!isInView) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 500); // Increased delay to ensure content has time to render

      return () => clearTimeout(timer);
    }
  }, [isActivePage]);

  // Simplified state management - use props if available, otherwise local state
  const isExpanded = setExpandedPageIds ? expandedPageIds.includes(pageId) : localIsExpanded;

  const shouldShowSubPages = !isDragging && isExpanded && sub_pages_count !== undefined && sub_pages_count > 0;
  const canShowAddButton = !!(
    page?.canCurrentUserEditPage &&
    page?.isContentEditable &&
    workspaceSlug &&
    isNestedPagesEnabled(workspaceSlug.toString())
  );

  const handleItemMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleItemMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleSubPagesLoaded = useCallback(() => {
    setSubPagesLoaded(true);
  }, []);
  const handlePromotePageToRootAndReorder = useCallback(
    async (droppedPageId: string, position: "before" | "after") => {
      if (!collectionId || !workspaceSlug) return;

      await collectionStore.movePageWithCollectionContext({
        pageId: droppedPageId,
        sourceCollectionId: collectionId,
        targetCollectionId: collectionId,
        targetParentId: null,
        reorderTargetPageId: pageId,
        reorderPosition: position,
      });
    },
    [collectionId, collectionStore, pageId, workspaceSlug]
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
    }: {
      self: { element: Element; data: Record<string, unknown> };
      location: { current: { dropTargets: Array<{ element?: Element }> } };
    }) => {
      const isPrimaryDropTarget = location.current.dropTargets[0]?.element === self.element;
      setDropIndicatorEdge(isPrimaryDropTarget ? extractClosestEdge(self.data) : null);
    },
    []
  );

  useEffect(() => {
    const isActiveBranch = isActivePage || currentPage?.parentPageIds?.includes(pageId);

    if (hasLoadedAllSubPages) {
      if (!subPagesLoaded) {
        setSubPagesLoaded(true);
      }
      return;
    }

    if (collectionId && isActiveBranch && expectedSubPagesCount > loadedSubPageIdsCount && subPagesLoaded) {
      setSubPagesLoaded(false);
    }
  }, [
    collectionId,
    currentPage?.parentPageIds,
    expectedSubPagesCount,
    hasLoadedAllSubPages,
    isActivePage,
    loadedSubPageIdsCount,
    pageId,
    subPagesLoaded,
  ]);

  useEffect(() => {
    const isActiveBranch = isActivePage || currentPage?.parentPageIds?.includes(pageId);

    if (collectionId && !isActiveBranch) return;
    if (!isExpanded || !page || !page.id || expectedSubPagesCount <= 0 || subPagesLoaded || hasLoadedAllSubPages) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      try {
        await page.fetchSubPages();
        if (isCancelled) return;

        setSubPagesLoaded(true);
      } catch {
        // Manual expand path already surfaces a toast; silent retries here keep auto-reveal resilient.
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [
    collectionId,
    currentPage?.parentPageIds,
    isActivePage,
    isExpanded,
    pageId,
    page,
    subPagesLoaded,
    expectedSubPagesCount,
    hasLoadedAllSubPages,
  ]);

  // Simplified toggle function - single responsibility
  const handleToggleExpanded = () => {
    if (setExpandedPageIds) {
      // Using parent component's state management
      setExpandedPageIds((prev) => {
        // Use sets for efficient operations
        const currentSet = new Set(prev);

        if (currentSet.has(pageId)) {
          // If page is already expanded, collapse it and all its children
          const childrenToCollapse = getChildrenPageIds(pageId);
          childrenToCollapse.forEach((id) => currentSet.delete(id));
          currentSet.delete(pageId);
        } else {
          // Just add this page ID
          currentSet.add(pageId);
        }

        return Array.from(currentSet);
      });
    } else {
      // Using local state
      setLocalIsExpanded((prev) => !prev);
    }
  };

  // Helper function to get all children page IDs (including nested)
  const getChildrenPageIds = useCallback(
    (parentId: string): string[] => {
      const children: string[] = [];

      const collectChildren = (id: string) => {
        const page = getPageById(id);
        if (!page) return;

        const subpageIds = getChildPageIds ? getChildPageIds(id) : page.subPageIds || [];

        subpageIds.forEach((childId) => {
          children.push(childId);
          collectChildren(childId);
        });
      };

      collectChildren(parentId);
      return children;
    },
    [getChildPageIds, getPageById]
  );

  const handleCreatePage = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!page) return;

      setIsCreatingPage(true);

      try {
        const payload = {
          name: "",
          parent_id: page.id,
          access: page.access,
        };

        const newPage = await createPage(payload);

        // Redirect to the newly created page
        if (newPage?.id) {
          // Get the new page instance which has the getRedirectionLink method
          const newPageInstance = getPageById(newPage.id);
          if (newPageInstance?.getRedirectionLink) {
            const pageUrl = newPageInstance.getRedirectionLink();
            router.push(pageUrl);
          }
        }
      } catch (error) {
        console.error("Failed to create page:", error);
      } finally {
        setIsCreatingPage(false);
      }
    },
    [getPageById, router, createPage, page]
  );

  // drag and drop with reordering
  useEffect(() => {
    const element = listItemRef.current;
    if (!element || !page || !page.id) return;

    const initialData: TPageDragPayload = {
      id: page.id,
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
                <div className="w-[225px] flex items-center gap-1 py-1.5 truncate rounded-md text-secondary bg-layer-1 opacity-40">
                  <div className="size-4 flex-shrink-0 grid place-items-center">
                    <span className="grid place-items-center">
                      {page.logo_props?.in_use ? (
                        <Logo logo={page.logo_props} size={14} type="lucide" />
                      ) : (
                        <PageIcon className="size-3.5" />
                      )}
                    </span>
                  </div>
                  <p className="truncate text-13 flex-grow min-w-0">{getPageName(page.name)}</p>
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
            ? collectionStore.canCurrentUserReorderPageInCollection(page.id as string, collectionId)
            : page.canCurrentUserEditPage &&
              page.isContentEditable &&
              isNestedPagesEnabled(workspaceSlug.toString()) &&
              !page.archived_at &&
              (!page.is_shared || page.isCurrentUserOwner),
      }),
      dropTargetForElements({
        element,
        getData: ({ input, element }) =>
          attachClosestEdge(initialData, {
            element,
            input,
            allowedEdges: ["top", "bottom"],
          }),
        onDragEnter: ({ self, location }) => {
          updateDropIndicatorEdge({ self, location });
        },
        onDrag: ({ self, location }) => {
          updateDropIndicatorEdge({ self, location });
        },
        onDragLeave: () => {
          setDropIndicatorEdge(null);
        },
        onDrop: ({ location, self, source }) => {
          setDropIndicatorEdge(null);

          if (location.current.dropTargets[0]?.element !== self.element) return;

          const sourceData = source.data as TPageDragPayload;
          const { id: droppedPageId } = sourceData;

          const closestEdge = extractClosestEdge(self.data);
          if (closestEdge) {
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
              void handlePromotePageToRootAndReorder(droppedPageId, position);
              return;
            }

            handleReorderPages?.(droppedPageId, pageId, position);
          }
        },
        canDrop: ({ source }) => {
          if (isDropping || !isNestedPagesEnabled(workspaceSlug.toString())) {
            return false;
          }

          // Cannot drop into shared section
          if (sectionType === "shared" || sectionType === "archived") return false;

          const sourceData = source.data as TPageDragPayload;
          const { id: droppedPageId } = sourceData;
          if (!droppedPageId) return false;
          if (droppedPageId === page.id) return false;
          if (collectionId && sourceData.collectionId !== collectionId) {
            return collectionStore.canCurrentUserAddPageToCollection(droppedPageId);
          }

          // Get the source page to check additional properties
          const sourcePage = getPageById(droppedPageId);
          if (!sourcePage) return false;

          // Block private pages from being dropped into a collection
          if (collectionId && sourcePage.access !== EPageAccess.PUBLIC) return false;

          // Allow dropping shared pages onto any accessible page (they will inherit the target's access)
          if (sourcePage.is_shared) {
            return true;
          }

          return true;
        },
      })
    );
  }, [
    expandedPageIds,
    collectionId,
    collectionStore,
    getPageById,
    isDragging,
    isDropping,
    localIsExpanded,
    page,
    pageId,
    setExpandedPageIds,
    isNestedPagesEnabled,
    workspaceSlug,
    sectionType,
    handleReorderPages,
    handleMoveAcrossCollectionsAndReorder,
    handlePromotePageToRootAndReorder,
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
      {/* Drop Indicator */}
      <DropIndicator
        classNames={cn({
          "is-reordering": dropIndicatorEdge === "top",
        })}
        isVisible={dropIndicatorEdge === "top" && !isDropping}
      />
      <div
        ref={itemContentRef}
        className={cn("relative", {
          "opacity-30": isDragging,
        })}
        onMouseEnter={handleItemMouseEnter}
        onMouseLeave={handleItemMouseLeave}
      >
        <WikiPageSidebarListItem
          handleToggleExpanded={handleToggleExpanded}
          onSubPagesLoaded={handleSubPagesLoaded}
          isDragging={isDragging}
          isExpanded={isExpanded}
          paddingLeft={paddingLeft}
          pageId={pageId}
          isHovered={isHovered}
          canShowAddButton={canShowAddButton}
          sectionType={sectionType}
          collectionId={collectionId}
          setIsDropping={setIsDropping}
          setLocalIsExpanded={setLocalIsExpanded}
          setExpandedPageIds={setExpandedPageIds}
        />
        {isHovered && canShowAddButton && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-md hover:bg-layer-transparent-hover text-tertiary hover:text-primary transition-all duration-200 ease-in-out z-10"
            onClick={(event) => void handleCreatePage(event)}
            data-prevent-progress
            disabled={isCreatingPage}
          >
            {isCreatingPage ? <Loader className="size-3 animate-spin" /> : <PlusIcon className="size-3" />}
          </button>
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
          <div>
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
            {/* Drop Indicator */}
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
