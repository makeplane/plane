/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";

export function ProjectInsightsLoader() {
  return (
    <div className="flex h-[200px] gap-1">
      <div className="h-[200px] w-full">
        <Skeleton aria-label="Loading chart">
          <div className="h-full w-full">
            <SkeletonItem blockSize="100%" inlineSize="100%" />
          </div>
        </Skeleton>
      </div>
      <div className="flex h-full w-full flex-col gap-1">
        <Skeleton aria-label="Loading chart">
          <div className="h-12 w-full">
            <SkeletonItem blockSize="100%" />
          </div>
        </Skeleton>
        <Skeleton aria-label="Loading chart">
          <div className="h-full w-full">
            <SkeletonItem blockSize="100%" />
          </div>
        </Skeleton>
      </div>
    </div>
  );
}

export function ChartLoader() {
  return (
    <Skeleton aria-label="Loading chart">
      <div className="h-[350px] w-full">
        <SkeletonItem blockSize="100%" />
      </div>
    </Skeleton>
  );
}
