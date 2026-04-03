/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function CycleModuleBoardLayoutLoader() {
  return (
    <div className="h-full w-full animate-pulse">
      <div className="flex h-full w-full justify-between">
        <div className="3xl:grid-cols-4 grid h-full w-full auto-rows-max grid-cols-1 gap-6 overflow-y-auto p-8 transition-all lg:grid-cols-2 xl:grid-cols-3">
          {range(5).map((i) => (
            <div
              key={i}
              className="flex h-44 w-full flex-col justify-between rounded-sm border border-subtle bg-surface-1 p-4 text-13"
            >
              <div className="flex items-center justify-between">
                <span className="h-6 w-24 rounded-sm bg-layer-1" />
                <div className="flex items-center gap-2">
                  <span className="h-6 w-20 rounded-sm bg-layer-1" />
                  <span className="h-6 w-6 rounded-sm bg-layer-1" />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-sm bg-layer-1" />
                    <span className="h-5 w-20 rounded-sm bg-layer-1" />
                  </div>
                  <span className="h-5 w-5 rounded-full bg-layer-1" />
                </div>
                <span className="h-1.5 rounded-sm bg-layer-1" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="h-4 w-16 rounded-sm bg-layer-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-sm bg-layer-1" />
                    <span className="h-4 w-4 rounded-sm bg-layer-1" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
