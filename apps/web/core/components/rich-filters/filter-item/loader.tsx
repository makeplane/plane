/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
export function FilterItemLoader() {
  return (
    <Skeleton aria-label="Loading filter">
      <SkeletonItem blockSize="28px" inlineSize="180px" />
    </Skeleton>
  );
}
