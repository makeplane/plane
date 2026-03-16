/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function ProjectsLoader() {
  return (
    <div className="h-full w-full animate-pulse overflow-y-auto p-8">
      <div className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
        {range(3).map((i) => (
          <div key={i} className="flex cursor-pointer flex-col rounded-sm border border-subtle bg-surface-1">
            <div className="relative min-h-[118px] w-full rounded-t border-b border-subtle">
              <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/20 to-transparent">
                <div className="absolute bottom-4 z-10 flex h-10 w-full items-center justify-between gap-3 px-4">
                  <div className="flex flex-grow items-center gap-2.5 truncate">
                    <span className="min-h-9 min-w-9 rounded-sm bg-layer-1" />
                    <div className="flex w-full flex-col justify-between gap-0.5 truncate">
                      <span className="h-4 w-28 rounded-sm bg-layer-1" />
                      <span className="h-4 w-16 rounded-sm bg-layer-1" />
                    </div>
                  </div>
                  <div className="flex h-full flex-shrink-0 items-center gap-2">
                    <span className="h-6 w-6 rounded-sm bg-layer-1" />
                    <span className="h-6 w-6 rounded-sm bg-layer-1" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex h-[104px] w-full flex-col justify-between rounded-b-sm p-4">
              <span className="h-4 w-36 rounded-sm bg-layer-1" />
              <div className="item-center flex justify-between">
                <span className="h-5 w-20 rounded-sm bg-layer-1" />
                <span className="h-5 w-5 rounded-sm bg-layer-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
