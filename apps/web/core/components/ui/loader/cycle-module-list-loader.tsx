/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function CycleModuleListLayoutLoader() {
  return (
    <div className="h-full animate-pulse overflow-y-auto">
      <div className="flex h-full w-full justify-between">
        <div className="flex h-full w-full flex-col overflow-y-auto">
          {range(5).map((i) => (
            <div
              key={i}
              className="flex w-full flex-col items-center justify-between gap-5 border-b border-subtle px-5 py-6 sm:flex-row"
            >
              <div className="relative flex w-full items-center justify-between gap-3 overflow-hidden">
                <div className="relative flex w-full items-center gap-3 overflow-hidden">
                  <div className="flex items-center gap-4 truncate">
                    <span className="h-10 w-10 rounded-full bg-layer-1" />
                    <span className="h-5 w-20 rounded-sm bg-layer-1" />
                  </div>
                </div>
                <span className="h-6 w-20 rounded-sm bg-layer-1" />
              </div>
              <div className="relative flex w-full items-center justify-between gap-2.5 overflow-hidden sm:w-auto sm:flex-shrink-0 sm:justify-end">
                <div className="relative flex flex-shrink-0 items-center gap-3">
                  <span className="h-5 w-5 rounded-sm bg-layer-1" />
                  <span className="h-5 w-5 rounded-sm bg-layer-1" />
                  <span className="h-5 w-5 rounded-sm bg-layer-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
