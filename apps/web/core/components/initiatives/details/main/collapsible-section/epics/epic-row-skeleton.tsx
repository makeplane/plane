/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Skeleton } from "@plane/propel/skeleton";

type EpicRowSkeletonProps = {
  variant?: "default" | "dropdown";
};

export const EpicRowSkeleton = ({ variant = "default" }: EpicRowSkeletonProps) => (
  <div
    className={
      variant === "dropdown"
        ? "flex items-center gap-1.5 rounded-sm px-1 py-1.5"
        : "flex items-center gap-2 rounded-md px-3 py-2 my-0.5"
    }
  >
    <Skeleton>
      <Skeleton.Item height="16px" width="16px" className="rounded-sm" />
    </Skeleton>
    <Skeleton>
      <Skeleton.Item height="6px" width="6px" className="rounded-full" />
    </Skeleton>
    <Skeleton>
      <Skeleton.Item height="16px" width="16px" className="rounded" />
    </Skeleton>
    <Skeleton className="flex-1 min-w-0">
      <Skeleton.Item height="14px" width="64px" />
    </Skeleton>
    <Skeleton className="flex-1 min-w-0 max-w-4">
      <Skeleton.Item height="14px" width="100%" />
    </Skeleton>
  </div>
);
