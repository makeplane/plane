/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { range } from "lodash-es";

export function PageLoader() {
  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="border-b border-subtle px-3 py-3">
        <Skeleton aria-label="Loading page">
          <div className="relative flex items-center gap-2">
            <SkeletonItem blockSize="30px" inlineSize="200px" />
            <div className="relative ml-auto flex items-center gap-2">
              <SkeletonItem blockSize="30px" inlineSize="100px" />
              <SkeletonItem blockSize="30px" inlineSize="100px" />
            </div>
          </div>
        </Skeleton>
      </div>
      <div>
        {range(10).map((i) => (
          <Skeleton aria-label="Loading page" key={i}>
            <div className="relative flex items-center gap-2 border-b border-subtle p-3 py-4">
              <SkeletonItem blockSize="22px" inlineSize={`${250 + 10 * Math.floor(Math.random() * 10)}px`} />
              <div className="relative ml-auto flex items-center gap-2">
                <SkeletonItem blockSize="22px" inlineSize="60px" />
                <SkeletonItem blockSize="22px" inlineSize="22px" />
                <SkeletonItem blockSize="22px" inlineSize="22px" />
                <SkeletonItem blockSize="22px" inlineSize="22px" />
              </div>
            </div>
          </Skeleton>
        ))}
      </div>
    </div>
  );
}
