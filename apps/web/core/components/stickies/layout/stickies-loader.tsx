/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
// plane ui

export function StickiesLoader() {
  return (
    <div className="grid grid-cols-4 gap-4 overflow-scroll pb-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton aria-label="Loading sticky" key={index}>
          <div className="space-y-5 rounded-sm border border-subtle p-3">
            <div className="space-y-2">
              <SkeletonItem blockSize="20px" />
              <SkeletonItem blockSize="15px" inlineSize="75%" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <SkeletonItem blockSize="15px" inlineSize="15px" />
                </div>
                <SkeletonItem blockSize="15px" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <SkeletonItem blockSize="15px" inlineSize="15px" />
                </div>
                <SkeletonItem blockSize="15px" inlineSize="75%" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <SkeletonItem blockSize="15px" inlineSize="15px" />
                </div>
                <SkeletonItem blockSize="15px" inlineSize="90%" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <SkeletonItem blockSize="15px" inlineSize="15px" />
                </div>
                <SkeletonItem blockSize="15px" inlineSize="60%" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <SkeletonItem blockSize="15px" inlineSize="15px" />
                </div>
                <SkeletonItem blockSize="15px" inlineSize="50%" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SkeletonItem blockSize="25px" inlineSize="25px" />
                <SkeletonItem blockSize="25px" inlineSize="25px" />
                <SkeletonItem blockSize="25px" inlineSize="25px" />
              </div>
              <div className="flex-shrink-0">
                <SkeletonItem blockSize="25px" inlineSize="25px" />
              </div>
            </div>
          </div>
        </Skeleton>
      ))}
    </div>
  );
}
