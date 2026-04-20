/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment } from "react";
import { range } from "lodash-es";

export const ProjectLoadingSkeleton = () => {
  return (
    <div className="bg-surface-0 flex h-full w-full flex-col overflow-hidden">
      {/* Header skeleton */}
      <div className="border-b border-subtle bg-surface-1 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="h-8 w-32 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 animate-pulse rounded bg-surface-2" />
            <div className="h-8 w-20 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="bg-surface-0 border-b border-subtle px-4 py-3">
        <div className="flex items-center gap-3">
          {range(3).map((i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded bg-surface-2" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 space-y-3 overflow-auto p-4">
        {/* Groups/sections with lines */}
        {range(3).map((groupIdx) => (
          <Fragment key={groupIdx}>
            {/* Group header */}
            <div className="mb-2 h-6 w-40 animate-pulse rounded bg-surface-2" />

            {/* Group items */}
            {range(4).map((itemIdx) => (
              <div key={itemIdx} className="h-11 w-full animate-pulse rounded bg-surface-1" />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
