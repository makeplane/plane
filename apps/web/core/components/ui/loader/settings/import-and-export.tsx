/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function ImportExportSettingsLoader() {
  return (
    <div className="animate-pulse divide-y-[0.5px] divide-subtle-1">
      {range(2).map((i) => (
        <div key={i} className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="h-5 w-16 rounded-sm bg-layer-1" />
              <span className="h-5 w-16 rounded-sm bg-layer-1" />
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-28 rounded-sm bg-layer-1" />
              <span className="h-4 w-28 rounded-sm bg-layer-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
