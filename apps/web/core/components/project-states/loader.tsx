/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
export function ProjectStateLoader() {
  return (
    <Skeleton aria-label="Loading project states">
      <div className="space-y-5 md:w-2/3">
        <SkeletonItem blockSize="40px" />
        <SkeletonItem blockSize="40px" />
        <SkeletonItem blockSize="40px" />
        <SkeletonItem blockSize="40px" />
      </div>
    </Skeleton>
  );
}
