/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function ViewListLoader() {
  return (
    <div className="flex h-full w-full animate-pulse flex-col">
      {range(8).map((i) => (
        <div key={i} className="group border-b border-subtle">
          <div className="relative flex w-full items-center justify-between rounded-sm p-4">
            <div className="flex items-center gap-4">
              <span className="min-h-10 min-w-10 rounded-sm bg-layer-1" />
              <span className="h-6 w-28 rounded-sm bg-layer-1" />
            </div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-sm bg-layer-1" />
              <span className="h-5 w-5 rounded-sm bg-layer-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
