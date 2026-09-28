/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, useLayoutEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, Key, ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ScrollToOptions, VirtualItem } from "@tanstack/react-virtual";

type VirtualListOwnProps = {
  count: number;
  estimateSize?: number | ((index: number) => number);
  gap?: number;
  getItemKey?: (index: number) => Key;
  itemPositioningStrategy?: "transform" | "top";
  measureElement?: boolean;
  overscan?: number;
  /**
   * Imperatively scroll to a row index whenever this value changes — useful for
   * keeping a keyboard-selected item visible. Ignored when negative/undefined.
   */
  scrollToIndex?: number;
  /** Alignment passed to the virtualizer when {@link scrollToIndex} changes (default "auto"). */
  scrollAlign?: ScrollToOptions["align"];
  /**
   * Windowed mode: virtualize against this external scroll element (e.g. a shared
   * ScrollArea viewport) instead of an internal scroll container. When set, this
   * component renders only the spacer + rows — the caller owns the scroll element.
   * Pair with {@link scrollMargin} so multiple lists can share one scroller.
   */
  scrollElement?: HTMLElement | null;
  /**
   * Offset (px) of this list's content from the top of the shared scroll element's
   * content. Only meaningful alongside {@link scrollElement}. Defaults to 0.
   */
  scrollMargin?: number;
  /** Rendered inside the scroll container after the virtualized rows (e.g. a "Load more" button). */
  footer?: ReactNode;
  children: (virtualItem: VirtualItem) => ReactNode;
};

export type VirtualListProps = VirtualListOwnProps & Omit<ComponentPropsWithoutRef<"div">, keyof VirtualListOwnProps>;

/**
 * Drop-in virtualized list. Owns the scroll container and all positioning
 * boilerplate so callers only supply the scroll-container className and a
 * render function for each visible item.
 *
 * Usage:
 *   <VirtualList
 *     count={items.length}
 *     estimateSize={28}
 *     className="max-h-48 overflow-y-auto"
 *   >
 *     {(v) => <Row item={items[v.index]} />}
 *   </VirtualList>
 */
export function VirtualList({
  count,
  estimateSize = 28,
  gap,
  getItemKey,
  itemPositioningStrategy = "transform",
  measureElement = true,
  overscan = 10,
  scrollToIndex,
  scrollAlign = "auto",
  scrollElement,
  scrollMargin = 0,
  footer,
  children,
  ...divProps
}: VirtualListProps) {
  // refs
  const parentRef = useRef<HTMLDivElement | null>(null);
  // when a scroll element is supplied we virtualize against it (windowed mode)
  // rather than owning the scroll container ourselves
  const windowed = scrollElement !== undefined;
  // react-virtual
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => (windowed ? (scrollElement ?? null) : parentRef.current),
    estimateSize: typeof estimateSize === "number" ? () => estimateSize : estimateSize,
    gap,
    getItemKey,
    overscan,
    scrollMargin: windowed ? scrollMargin : undefined,
  });
  // derived values
  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const getItemOffset = (virtualItem: VirtualItem) => virtualItem.start - (windowed ? scrollMargin : 0);

  // keep the requested row visible (e.g. the keyboard-selected item)
  useLayoutEffect(() => {
    if (scrollToIndex === undefined || scrollToIndex < 0) return;
    virtualizer.scrollToIndex(scrollToIndex, { align: scrollAlign });
  }, [scrollToIndex, scrollAlign, virtualizer]);

  return (
    <div ref={parentRef} {...divProps}>
      <div className="relative" style={{ height: totalSize }}>
        {virtualItems.map((virtualItem) => (
          // Key the Fragment, not the host <div>: React DevTools pins a keyed host element after
          // unmount, leaking the detached row subtree until released (TanStack virtual #1024).
          <Fragment key={virtualItem.key}>
            <div
              data-index={virtualItem.index}
              ref={measureElement ? virtualizer.measureElement : undefined}
              className="absolute top-0 left-0 w-full"
              style={
                itemPositioningStrategy === "top"
                  ? {
                      top: getItemOffset(virtualItem),
                    }
                  : {
                      // in windowed mode item.start is measured from the shared scroller's
                      // content top, so subtract this list's offset to position locally
                      transform: `translateY(${getItemOffset(virtualItem)}px)`,
                    }
              }
            >
              {children(virtualItem)}
            </div>
          </Fragment>
        ))}
      </div>
      {footer}
    </div>
  );
}
