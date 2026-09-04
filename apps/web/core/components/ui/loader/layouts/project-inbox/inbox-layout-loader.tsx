/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import React from "react";
// ui
import { InboxSidebarLoader } from "./inbox-sidebar-loader";

export function InboxLayoutLoader() {
  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <div className="h-full w-2/6 flex-shrink-0 border-r border-strong">
        <InboxSidebarLoader />
      </div>
      <div className="w-4/6">
        <Skeleton aria-label="Loading inbox">
          <div className="flex h-full flex-col gap-5 p-5">
            <div className="space-y-2">
              <SkeletonItem blockSize="30px" inlineSize="40%" />
              <SkeletonItem blockSize="15px" inlineSize="60%" />
              <SkeletonItem blockSize="15px" inlineSize="60%" />
              <SkeletonItem blockSize="15px" inlineSize="40%" />
            </div>
            <SkeletonItem blockSize="150px" />
          </div>
        </Skeleton>
      </div>
    </div>
  );
}
