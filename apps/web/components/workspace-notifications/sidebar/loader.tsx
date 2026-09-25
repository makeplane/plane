/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function NotificationsLoader() {
  return (
    <div className="animate-pulse divide-y divide-subtle overflow-hidden">
      {range(8).map((i) => (
        <div key={i} className="flex w-full items-center gap-4 p-3">
          <span className="min-h-12 min-w-12 rounded-full bg-layer-1" />
          <div className="flex w-full flex-col gap-2.5">
            <span className="h-5 w-36 rounded-xs bg-layer-1" />
            <div className="flex w-full items-center justify-between gap-2">
              <span className="h-5 w-28 rounded-xs bg-layer-1" />
              <span className="h-5 w-16 rounded-xs bg-layer-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
