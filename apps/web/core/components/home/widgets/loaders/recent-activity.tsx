/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { range } from "lodash-es";

export function RecentActivityWidgetLoader() {
  return (
    <Skeleton aria-label="Loading recent activity">
      <div className="space-y-6 rounded-xl px-2">
        {range(5).map((index) => (
          <div key={index} className="flex items-start gap-3.5">
            <div className="flex-shrink-0">
              <SkeletonItem blockSize="32px" inlineSize="32px" />
            </div>
            <div className="my-auto w-full flex-shrink-0 space-y-3">
              <SkeletonItem blockSize="15px" inlineSize="70%" />
            </div>
          </div>
        ))}
      </div>
    </Skeleton>
  );
}
