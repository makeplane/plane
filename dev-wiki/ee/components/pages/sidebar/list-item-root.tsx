"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// lucide icons
import { Loader, Plus } from "lucide-react";
import { Transition } from "@headlessui/react";
// plane imports
import { EPageAccess } from "@plane/constants";
import { TPageDragPayload } from "@plane/types";
// plane utils
import { cn } from "@plane/utils";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";
// local imports
import { WikiPageSidebarListItem } from "./list-item";

type Props = {
  paddingLeft: number;
  pageId: string;
  expandedPageIds?: string[];
  setExpandedPageIds?: React.Dispatch<React.SetStateAction<string[]>>;
  sectionType?: "public" | "private" | "archived" | "shared";
};

export const WikiPageSidebarListItemRoot: React.FC<Props> = observer((props) => {
  const { paddingLeft, pageId, expandedPageIds = [], setExpandedPageIds, sectionType } = props;
  // states
  const [localIsExpanded, setLocalIsExpanded] = useState(false);
  const [subPagesLoaded, setSubPagesLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // refs
  const listItemRef = useRef<HTMLDivElement>(null);
  const itemContentRef = useRef<HTMLDivElement>(null);
  // router and params
  const router = useAppRouter();
  const { workspaceSlug, pageId: currentPageIdParam } = useParams();
  // store hooks
  const { getPageById, createPage, isNestedPagesEnabled } = usePageStore(EPageStoreType.WORKSPACE);
  const page = usePage({
    pageId,
    storeType: EPageStoreType.WORKSPACE,
  });
  // derived values
  const { sub_pages_count, subPageIds } = page ?? {};

  // Check if this is the active page
  const isActivePage = currentPageIdParam && currentPageIdParam.toString() === pageId;

  // Auto-scroll to active page when sidebar renders
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

  // Precise hover detection
  const handleMouseMove = (e: MouseEvent) => {
    if (!itemContentRef.current) return;

    const rect = itemContentRef.current.getBoundingClientRect();
    const isInBounds =
      e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

    setIsHovered(isInBounds);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Load sub-pages when expanded
  useEffect(() => {
    if (isExpanded && sub_pages_count && sub_pages_count > 0 && !subPagesLoaded && page) {
      page.fetchSubPages();
      setSubPagesLoaded(true);
    }
  }, [isExpanded, sub_pages_count, subPagesLoaded, page]);

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

        const subpageIds = page.subPageIds || [];

        subpageIds.forEach((childId) => {
          children.push(childId);
          collectChildren(childId);
        });
      };

      collectChildren(parentId);
      return children;
    },
    [getPageById]
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

  // drag and drop
  useEffect(() => {
    const element = listItemRef.current;
    if (!element || !page || !page.id) return;

    const initialData: TPageDragPayload = {
      id: page.id,
      parentId: page.parent_id ?? null,
    };
    return combine(
      draggable({
        element,
        dragHandle: element,
        getInitialData: () => initialData,
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
        canDrag: () =>
          page.canCurrentUserEditPage &&
          page.isContentEditable &&
          isNestedPagesEnabled(workspaceSlug.toString()) &&
          !page.archived_at &&
          // For shared pages, only the owner can drag them
          (!page.is_shared || page.isCurrentUserOwner),
      }),
      dropTargetForElements({
        element,
        onDragEnter: () => {
          setIsDropping(true);
          if (setExpandedPageIds) {
            if (!expandedPageIds.includes(pageId)) {
              setExpandedPageIds([...expandedPageIds, pageId]);
            }
          } else {
            setLocalIsExpanded(true);
          }
        },
        onDragLeave: () => {
          setIsDropping(false);
        },
        onDragStart: () => {
          setIsDropping(true);
        },
        onDrop: ({ location, self, source }) => {
          setIsDropping(false);
          if (location.current.dropTargets[0]?.element !== self.element) return;
          const { id: droppedPageId } = source.data as TPageDragPayload;
          const droppedPageDetails = getPageById(droppedPageId);
          if (!droppedPageDetails) return;

          // Prepare update payload
          const updatePayload: { parent_id?: string; access?: EPageAccess } = {
            parent_id: page.id,
          };

          // Map sectionType to access value
          let targetAccess: EPageAccess | undefined;
          if (sectionType === "public") {
            targetAccess = EPageAccess.PUBLIC;
          } else if (sectionType === "private") {
            targetAccess = EPageAccess.PRIVATE;
          }

          // Check if access needs to be updated (section has changed)
          if (targetAccess !== undefined && droppedPageDetails.access !== targetAccess) {
            updatePayload.access = targetAccess;
          }

          droppedPageDetails.update(updatePayload);
        },
        canDrop: ({ source }) => {
          if (
            !page.canCurrentUserEditPage ||
            !page.isContentEditable ||
            !isNestedPagesEnabled(workspaceSlug.toString()) ||
            page.archived_at
          ) {
            return false;
          }

          const { id: droppedPageId, parentId: droppedPageParentId } = source.data as TPageDragPayload;
          if (!droppedPageId) return false;

          // Get the source page to check additional properties
          const sourcePage = getPageById(droppedPageId);
          if (!sourcePage) return false;

          const isSamePage = droppedPageId === page.id;
          const isImmediateParent = droppedPageParentId === page.id;
          const isAnyLevelChild = page.parentPageIds.includes(droppedPageId);

          if (isSamePage || isImmediateParent || isAnyLevelChild) return false;

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
    getPageById,
    isDragging,
    localIsExpanded,
    page,
    pageId,
    setExpandedPageIds,
    isNestedPagesEnabled,
    workspaceSlug,
    sectionType,
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
      <div ref={itemContentRef} className="relative">
        <WikiPageSidebarListItem
          handleToggleExpanded={handleToggleExpanded}
          isDragging={isDragging}
          isExpanded={isExpanded}
          paddingLeft={paddingLeft}
          pageId={pageId}
          isHovered={isHovered}
          canShowAddButton={canShowAddButton}
        />
        {isHovered && canShowAddButton && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-md hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-all duration-200 ease-in-out z-10"
            onClick={handleCreatePage}
            data-prevent-progress
            disabled={isCreatingPage}
          >
            {isCreatingPage ? <Loader className="size-3 animate-spin" /> : <Plus className="size-3" />}
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
            {subPageIds?.map((subPageId) => (
              <WikiPageSidebarListItemRoot
                key={subPageId}
                paddingLeft={paddingLeft + 16}
                pageId={subPageId}
                expandedPageIds={expandedPageIds}
                setExpandedPageIds={setExpandedPageIds}
                sectionType={sectionType}
              />
            ))}
          </div>
        </Transition>
      )}
    </div>
  );
});
