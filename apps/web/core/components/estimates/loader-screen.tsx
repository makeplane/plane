/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
export function EstimateLoaderScreen() {
  return (
    <Skeleton aria-label="Loading estimates">
      <div className="mt-5 space-y-5">
        <SkeletonItem blockSize="40px" />
        <SkeletonItem blockSize="40px" />
        <SkeletonItem blockSize="40px" />
        <SkeletonItem blockSize="40px" />
      </div>
    </Skeleton>
  );
}
