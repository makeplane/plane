/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cn } from "@plane/utils";
import { Skeleton } from "../skeleton/root";

type VirtualListSkeletonProps = {
  /** Number of placeholder rows (default 3). */
  rows?: number;
  /** Height of each placeholder row in px — derive from the list's `estimateSize` / row size so the
   * blocks match the real rows they stand in for. Default 52. */
  rowHeight?: number;
  /** className for the wrapper (horizontal padding / width). */
  className?: string;
};

/**
 * Pulse-animated placeholder rows for windowed lists — the default load-more loader for
 * {@link InfiniteVirtualList}, and reusable in any list load-more / warming-up slot. Renders N
 * full-width blocks sized to the row height so the loading state reads as "more rows" rather than a
 * generic spinner.
 */
export function VirtualListSkeleton({ rows = 3, rowHeight = 52, className }: VirtualListSkeletonProps) {
  return (
    <Skeleton ariaLabel="Loading more rows" className={cn("flex w-full flex-col gap-2", className)}>
      {Array.from({ length: Math.max(1, rows) }).map((_, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- static, identical placeholder rows
        <Skeleton.Item key={index} height={`${rowHeight}px`} width="100%" className="rounded-md" />
      ))}
    </Skeleton>
  );
}
