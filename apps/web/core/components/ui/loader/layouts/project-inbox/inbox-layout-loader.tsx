/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// ui
import { Loader } from "@plane/ui";
import { InboxSidebarLoader } from "./inbox-sidebar-loader";

export function InboxLayoutLoader() {
  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <div className="h-full w-2/6 flex-shrink-0 border-r border-strong">
        <InboxSidebarLoader />
      </div>
      <div className="w-4/6">
        <Loader className="flex h-full flex-col gap-5 p-5">
          <div className="space-y-2">
            <Loader.Item height="30px" width="40%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="40%" />
          </div>
          <Loader.Item height="150px" />
        </Loader>
      </div>
    </div>
  );
}
