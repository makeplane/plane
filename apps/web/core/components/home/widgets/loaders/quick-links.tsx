/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { range } from "lodash-es";

export function QuickLinksWidgetLoader() {
  return (
    <Skeleton aria-label="Loading quick links">
      <div className="flex flex-wrap gap-2 rounded-xl bg-surface-1">
        {range(4).map((index) => (
          <SkeletonItem key={index} blockSize="56px" inlineSize="230px" />
        ))}
      </div>
    </Skeleton>
  );
}
