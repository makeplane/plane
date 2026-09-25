/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function EmailSettingsLoader() {
  return (
    <div className="pb- mx-auto mt-8 h-full w-full animate-pulse overflow-y-auto px-6 lg:px-20">
      <div className="mb-2 flex flex-col gap-2 border-b border-subtle pt-6 pb-6">
        <span className="h-7 w-40 rounded-sm bg-layer-1" />
        <span className="h-5 w-96 rounded-sm bg-layer-1" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center py-3">
          <span className="h-7 w-32 rounded-sm bg-layer-1" />
        </div>
        {range(4).map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex flex-col gap-2 py-3">
              <span className="h-6 w-28 rounded-sm bg-layer-1" />
              <span className="h-5 w-96 rounded-sm bg-layer-1" />
            </div>
            <div className="flex items-center">
              <span className="h-5 w-5 rounded-sm bg-layer-1" />
            </div>
          </div>
        ))}
        <div className="flex items-center py-12">
          <span className="h-8 w-32 rounded-sm bg-layer-1" />
        </div>
      </div>
    </div>
  );
}
