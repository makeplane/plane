/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton } from "../skeleton";

type SelectOptionsSkeletonProps = {
  /** Number of placeholder rows. Default: 3. */
  rows?: number;
};

// Pulse-animated placeholder rows that mirror an option's `icon + text` layout (matching the
// `flex items-center gap-2 px-2 py-1.5` of a real `Combobox.Option`), shown while options load.
export function SelectOptionsSkeleton({ rows = 3 }: SelectOptionsSkeletonProps) {
  return (
    <Skeleton ariaLabel="Loading options" className="flex w-full flex-col">
      {Array.from({ length: Math.max(1, rows) }).map((_, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- static, identical placeholder rows
        <div key={index} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton.Item height="1rem" width="1rem" className="shrink-0 rounded-full" />
          <Skeleton.Item height="0.75rem" width={index % 2 === 0 ? "60%" : "45%"} className="rounded" />
        </div>
      ))}
    </Skeleton>
  );
}
