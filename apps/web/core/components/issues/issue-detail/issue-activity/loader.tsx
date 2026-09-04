/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";

export function IssueActivityLoader() {
  return (
    <Skeleton aria-label="Loading issue activity">
      <div className="space-y-8">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <SkeletonItem blockSize="28px" inlineSize="28px" />
          </div>
          <div className="w-full space-y-2">
            <SkeletonItem blockSize="8px" inlineSize="60%" />
            <SkeletonItem blockSize="8px" inlineSize="40%" />
            <SkeletonItem blockSize="10px" />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <SkeletonItem blockSize="28px" inlineSize="28px" />
          </div>
          <div className="w-full space-y-2">
            <SkeletonItem blockSize="8px" inlineSize="40%" />
            <SkeletonItem blockSize="8px" inlineSize="60%" />
            <SkeletonItem blockSize="10px" inlineSize="80%" />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <SkeletonItem blockSize="28px" inlineSize="28px" />
          </div>
          <div className="w-full space-y-2">
            <SkeletonItem blockSize="8px" inlineSize="60%" />
            <SkeletonItem blockSize="8px" inlineSize="40%" />
            <SkeletonItem blockSize="10px" />
          </div>
        </div>
      </div>
    </Skeleton>
  );
}
