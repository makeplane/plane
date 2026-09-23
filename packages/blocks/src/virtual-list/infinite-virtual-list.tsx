/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, Key, ReactNode } from "react";
import type { ScrollToOptions, VirtualItem } from "@tanstack/react-virtual";
import { VirtualList } from "./virtual-list";
import { VirtualListSkeleton } from "./list-skeleton";

type InfiniteVirtualListOwnProps = {
  /** Number of rows currently loaded. */
  count: number;
  /** Approximate row height (or a per-index fn) — tune to your row for smooth scrolling. Default 52. */
  estimateSize?: number | ((index: number) => number);
  /** Gap (px) between rows. */
  gap?: number;
  /** Stable key per row; strongly recommended so appended pages don't remount existing rows. */
  getItemKey?: (index: number) => Key;
  /** Rows rendered beyond the visible window on each side (default from {@link VirtualList}). */
  overscan?: number;
  /** Measure real row heights via ResizeObserver. Leave on for variable-height rows. */
  measureElement?: boolean;
  /** Imperatively scroll to a row index whenever this changes (e.g. a keyboard-selected item). */
  scrollToIndex?: number;
  /** Alignment used when {@link scrollToIndex} changes (default "auto"). */
  scrollAlign?: ScrollToOptions["align"];
  /** Whether another page can be loaded. While true, a bottom sentinel calls {@link onLoadMore} on scroll. */
  hasMore?: boolean;
  /**
   * Loads the next page. Overlapping calls are suppressed until the returned value settles, so a
   * sentinel lingering near the bottom can never stack fetches. Return a promise so the in-flight
   * loader shows for the right duration.
   */
  onLoadMore?: () => void | Promise<unknown>;
  /**
   * Prefetch distance from the bottom of the scroll container (IntersectionObserver rootMargin).
   * Default `"200px"` suits tall full-page lists. For short scrollports (dropdowns / nested menus
   * around `max-h-48`–`max-h-60`), pass `"0px"` — otherwise the sentinel intersects on first paint
   * whenever first-page overflow is less than the margin, and page 2 loads without user scroll.
   */
  loadMoreMargin?: string;
  /** Footer shown while a page is loading. Defaults to {@link VirtualListSkeleton} rows sized to `estimateSize`. */
  loader?: ReactNode;
  /** Number of skeleton placeholder rows in the default loader (default 3). Ignored when `loader` is set. */
  loaderRows?: number;
  /** className for the footer/sentinel wrapper. */
  loaderClassName?: string;
  /** Render fn for each visible row. */
  children: (virtualItem: VirtualItem) => ReactNode;
};

export type InfiniteVirtualListProps = InfiniteVirtualListOwnProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof InfiniteVirtualListOwnProps>;

/**
 * Infinite-scrolling virtualized list. Owns its scroll container and pages in more rows as the user
 * nears the bottom. Only the visible window of rows is mounted, no matter how many pages have loaded.
 *
 * The owning component must give the scroll container a bounded height and `overflow-y: auto`
 * (via `className` or `style`) — that element is the scroller this component virtualizes against.
 *
 * Why it owns the scroll container: the load-more sentinel must be observed against the *actual*
 * scroller, not the viewport. A viewport-rooted sentinel that lives inside an inner scroll container
 * reads as perpetually visible and auto-loads page after page until the renderer dies. Rooting the
 * IntersectionObserver on the owned scroller makes it fire only when genuinely scrolled near the end.
 * (If your scroll container is an *ancestor* shared with other content, use `VirtualList` with its
 * `scrollElement` prop instead.)
 *
 * @example
 * <InfiniteVirtualList
 *   count={ids.length}
 *   estimateSize={52}
 *   getItemKey={(i) => ids[i]}
 *   hasMore={hasMore}
 *   onLoadMore={loadMore}
 *   className="h-full w-full overflow-y-auto"
 * >
 *   {(v) => <Row id={ids[v.index]} />}
 * </InfiniteVirtualList>
 */
export function InfiniteVirtualList({
  count,
  estimateSize = 52,
  gap,
  getItemKey,
  overscan,
  measureElement,
  scrollToIndex,
  scrollAlign,
  hasMore = false,
  onLoadMore,
  loadMoreMargin = "200px",
  loader,
  loaderRows = 3,
  loaderClassName = "px-3 py-2",
  children,
  ...scrollContainerProps
}: InfiniteVirtualListProps) {
  // State refs (not plain refs) so the windowed virtualizer + the observer re-run once the elements
  // mount: the virtualizer needs the scroll element as a prop, and a plain ref wouldn't re-render.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Keep the latest handler / hasMore in refs so the observer effect doesn't churn on every render,
  // and so a queued observer callback can't fire onLoadMore after hasMore has flipped false.
  const onLoadMoreRef = useRef(onLoadMore);
  const hasMoreRef = useRef(hasMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
    hasMoreRef.current = hasMore;
  }, [onLoadMore, hasMore]);

  // Synchronous in-flight guard — React state alone can't stop a second intersection callback from
  // firing before the next render, which is exactly what stacks fetches into a runaway cascade.
  const loadingRef = useRef(false);
  const requestLoadMore = useCallback(() => {
    if (loadingRef.current || !hasMoreRef.current) return;
    const fn = onLoadMoreRef.current;
    if (!fn) return;
    loadingRef.current = true;
    setIsLoadingMore(true);
    void Promise.resolve(fn()).finally(() => {
      loadingRef.current = false;
      setIsLoadingMore(false);
    });
  }, []);

  // Observe the sentinel against the OWNED scroll container (not the viewport). `count` is in the deps
  // so the observer re-arms after each appended page: if the freshly loaded rows still don't fill the
  // viewport the sentinel stays visible and the next page loads — bounded by the container height,
  // never a cascade because requestLoadMore short-circuits while a fetch is in flight.
  useEffect(() => {
    if (!scrollEl || !sentinelEl || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1]?.isIntersecting) requestLoadMore();
      },
      { root: scrollEl, rootMargin: loadMoreMargin }
    );
    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [scrollEl, sentinelEl, hasMore, loadMoreMargin, count, requestLoadMore]);

  return (
    <div ref={setScrollEl} {...scrollContainerProps}>
      <VirtualList
        count={count}
        estimateSize={estimateSize}
        gap={gap}
        getItemKey={getItemKey}
        overscan={overscan}
        measureElement={measureElement}
        scrollToIndex={scrollToIndex}
        scrollAlign={scrollAlign}
        scrollElement={scrollEl}
      >
        {children}
      </VirtualList>
      {hasMore && (
        <div ref={setSentinelEl} className={loaderClassName}>
          {isLoadingMore
            ? (loader ?? (
                <VirtualListSkeleton
                  rows={loaderRows}
                  rowHeight={typeof estimateSize === "number" ? estimateSize : 52}
                />
              ))
            : null}
        </div>
      )}
    </div>
  );
}
