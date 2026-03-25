/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { range } from "lodash-es";

export function InboxSidebarLoader() {
  return (
    <div className="flex flex-col">
      {range(6).map((index) => (
        <div key={index} className="flex h-[105px] flex-col gap-2.5 space-y-3 border-b border-subtle p-4">
          <div className="flex flex-col gap-2">
            <span className="h-5 w-16 rounded-sm bg-layer-1" />
            <span className="h-5 w-36 rounded-sm bg-layer-1" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-20 rounded-sm bg-layer-1" />
            <span className="h-2 w-2 rounded-full bg-layer-1" />
            <span className="h-4 w-16 rounded-sm bg-layer-1" />
            <span className="h-4 w-16 rounded-sm bg-layer-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
