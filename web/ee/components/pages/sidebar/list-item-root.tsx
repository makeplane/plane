"use client";

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { Transition } from "@headlessui/react";
// plane imports
import { TPageDragPayload } from "@plane/types";
import { cn } from "@plane/utils";
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
  // refs
  const listItemRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { getPageById } = usePageStore(EPageStoreType.WORKSPACE);
  const page = usePage({
    pageId,
    storeType: EPageStoreType.WORKSPACE,
  });
  // derived values
  const { sub_pages_count, subPageIds } = page ?? {};
  const isExpanded = expandedPageIds.includes(pageId) || localIsExpanded;
  const shouldShowSubPages = !isDragging && isExpanded && sub_pages_count !== undefined && sub_pages_count > 0;

  // Load sub-pages when expanded
  useEffect(() => {
    if (isExpanded && sub_pages_count && sub_pages_count > 0 && !subPagesLoaded && page) {
      // This will trigger the loading of sub-pages if they're not already loaded
      page.fetchSubPages();
      setSubPagesLoaded(true);
    }
  }, [isExpanded, sub_pages_count, subPagesLoaded, page]);

  const handleToggleExpanded = () => {
    if (setExpandedPageIds) {
      setExpandedPageIds((prev) => (prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]));
    } else {
      setLocalIsExpanded((prev) => !prev);
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
      <WikiPageSidebarListItem
        handleToggleExpanded={handleToggleExpanded}
        isDragging={isDragging}
        isExpanded={isExpanded}
        paddingLeft={paddingLeft}
        pageId={pageId}
      />
      <Transition
        show={shouldShowSubPages}
        enter="transition-all duration-300 ease-in-out"
        enterFrom="opacity-0 max-h-0 overflow-hidden"
        enterTo="opacity-100 max-h-[1000px] overflow-hidden"
        leave="transition-all duration-200 ease-in-out"
        leaveFrom="opacity-100 max-h-[1000px] overflow-hidden"
        leaveTo="opacity-0 max-h-0 overflow-hidden"
      >
        <div className="transform-gpu">
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
