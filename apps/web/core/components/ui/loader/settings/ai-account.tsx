/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function AIAccountSettingsLoader() {
  return (
    <div className="flex flex-col gap-2">
      {range(3).map((i) => (
        <div key={i} className="flex items-center justify-between gap-4 rounded-lg border border-subtle px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="size-8 rounded-md bg-layer-1" />
            <div className="flex flex-col gap-1.5">
              <span className="h-4 w-36 rounded-sm bg-layer-1" />
              <span className="h-3 w-48 rounded-sm bg-layer-1" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-7 w-24 rounded-sm bg-layer-1" />
            <span className="h-7 w-24 rounded-sm bg-layer-1" />
            <span className="h-5 w-9 rounded-sm bg-layer-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
