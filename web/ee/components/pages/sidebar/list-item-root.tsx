"use client";

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// lucide icons
import { Loader, Plus } from "lucide-react";
import { Transition } from "@headlessui/react";
// plane imports
import { TPageDragPayload } from "@plane/types";
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
};

export const WikiPageSidebarListItemRoot: React.FC<Props> = observer((props) => {
  const { paddingLeft, pageId, expandedPageIds = [], setExpandedPageIds } = props;
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
  const { workspaceSlug } = useParams();
  // store hooks
  const { getPageById, createPage, isNestedPagesEnabled } = usePageStore(EPageStoreType.WORKSPACE);
  const page = usePage({
    pageId,
    storeType: EPageStoreType.WORKSPACE,
  });
  // derived values
  const { sub_pages_count, subPageIds } = page ?? {};

  // Simplified state management - use props if available, otherwise local state
  const isExpanded = setExpandedPageIds ? expandedPageIds.includes(pageId) : localIsExpanded;

  const shouldShowSubPages = !isDragging && isExpanded && sub_pages_count !== undefined && sub_pages_count > 0;
  const canShowAddButton =
    page?.canCurrentUserEditPage &&
    page?.isContentEditable &&
    workspaceSlug &&
    isNestedPagesEnabled(workspaceSlug.toString());

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
      setExpandedPageIds((prev) => (prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]));
    } else {
      // Using local state
      setLocalIsExpanded((prev) => !prev);
    }
  };

  const handleCreatePage = async (e: React.MouseEvent) => {
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

      // Expand the current page to show the newly created subpage
      if (setExpandedPageIds && !expandedPageIds.includes(pageId)) {
        setExpandedPageIds([...expandedPageIds, pageId]);
      } else if (!localIsExpanded) {
        setLocalIsExpanded(true);
      }

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
  };

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
        canDrag: () => page.canCurrentUserEditPage && page.isContentEditable,
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
          droppedPageDetails.update({ parent_id: page.id });
        },
        canDrop: ({ source }) => {
          if (!page.canCurrentUserEditPage || !page.isContentEditable) return false;
          const { id: droppedPageId, parentId: droppedPageParentId } = source.data as TPageDragPayload;
          if (!droppedPageId) return false;
          const isSamePage = droppedPageId === page.id;
          const isImmediateParent = droppedPageParentId === page.id;
          const isAnyLevelChild = page.parentPageIds.includes(droppedPageId);
          if (isSamePage || isImmediateParent || isAnyLevelChild) return false;
          return true;
        },
      })
    );
  }, [expandedPageIds, getPageById, isDragging, localIsExpanded, page, pageId, setExpandedPageIds]);

  if (!page) return null;

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
        />
        {isHovered && canShowAddButton && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-md hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-all duration-200 ease-in-out"
            onClick={handleCreatePage}
            data-prevent-NProgress
            disabled={isCreatingPage}
          >
            {isCreatingPage ? <Loader className="size-3 animate-spin" /> : <Plus className="size-3" />}
          </button>
        )}
      </div>
      <Transition
        show={shouldShowSubPages}
        enter="transition-all duration-200 ease-out"
        enterFrom="opacity-0 max-h-0 -translate-y-2"
        enterTo="opacity-100 max-h-[1000px] translate-y-0"
        leave="transition-all duration-150 ease-in"
        leaveFrom="opacity-100 max-h-[1000px] translate-y-0"
        leaveTo="opacity-0 max-h-0 -translate-y-2"
        className="overflow-hidden"
      >
        <div className="transform-gpu will-change-transform">
          {subPageIds?.map((subPageId) => (
            <WikiPageSidebarListItemRoot
              key={subPageId}
              paddingLeft={paddingLeft + 17.6}
              pageId={subPageId}
              expandedPageIds={expandedPageIds}
              setExpandedPageIds={setExpandedPageIds}
            />
          ))}
        </div>
      </Transition>
    </div>
  );
});
