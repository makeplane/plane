/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronRightIcon, PageIcon } from "@plane/propel/icons";
// plane imports
import { cn, getPageName } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
import { BlockItemAction } from "@/components/pages/list/block-item-action";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import type { EPageStoreType } from "@/hooks/store";
import { usePage } from "@/hooks/store";

type TPageListBlock = {
  pageId: string;
  storeType: EPageStoreType;
  // tree props, omitted for flat lists
  depth?: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onMovePage?: (draggedPageId: string, targetPageId: string | null) => void;
};

export const PageListBlock = observer(function PageListBlock(props: TPageListBlock) {
  const { pageId, storeType, depth, hasChildren = false, isExpanded = false, onToggleExpand, onMovePage } = props;
  // refs
  const parentRef = useRef(null);
  const dragRef = useRef<HTMLDivElement | null>(null);
  // states
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // hooks
  const page = usePage({
    pageId,
    storeType,
  });
  const { isMobile } = usePlatformOS();

  // drag a page onto another one to make it a sub-page
  useEffect(() => {
    const element = dragRef.current;
    if (!element || !onMovePage) return;
    return combine(
      draggable({
        element,
        getInitialData: () => ({ id: pageId, type: "PAGE" }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source.data.type === "PAGE" && source.data.id !== pageId,
        onDragEnter: () => setIsDraggedOver(true),
        onDragLeave: () => setIsDraggedOver(false),
        onDrop: ({ source }) => {
          setIsDraggedOver(false);
          if (typeof source.data.id === "string") onMovePage(source.data.id, pageId);
        },
      })
    );
  }, [onMovePage, pageId]);

  // handle page check
  if (!page) return null;
  // derived values
  const { name, logo_props, getRedirectionLink } = page;
  const isTreeItem = depth !== undefined;

  return (
    <div
      ref={dragRef}
      className={cn({
        "bg-layer-1 outline-1 -outline-offset-1 outline-accent-strong": isDraggedOver,
        "opacity-60": isDragging,
      })}
    >
      <ListItem
        prependTitleElement={
          <div className="flex items-center gap-2" style={isTreeItem ? { paddingLeft: `${depth * 20}px` } : undefined}>
            {isTreeItem && (
              <button
                type="button"
                className={cn("grid size-5 place-items-center rounded-sm text-tertiary hover:bg-layer-1", {
                  invisible: !hasChildren,
                })}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
                aria-label={isExpanded ? "Collapse sub-pages" : "Expand sub-pages"}
                tabIndex={hasChildren ? 0 : -1}
              >
                <ChevronRightIcon className={cn("size-3.5 transition-transform", { "rotate-90": isExpanded })} />
              </button>
            )}
            {logo_props?.in_use ? (
              <Logo logo={logo_props} size={16} type="lucide" />
            ) : (
              <PageIcon className="h-4 w-4 text-tertiary" />
            )}
          </div>
        }
        className="min-h-0 gap-2 py-2"
        title={getPageName(name)}
        itemLink={getRedirectionLink()}
        actionableItems={<BlockItemAction page={page} parentRef={parentRef} storeType={storeType} />}
        isMobile={isMobile}
        parentRef={parentRef}
      />
    </div>
  );
});
