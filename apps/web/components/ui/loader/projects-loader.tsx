/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function ProjectsLoader() {
  return (
    <div className="h-full w-full animate-pulse overflow-y-auto px-page-x py-page-y">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {range(3).map((i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-subtle bg-layer-2">
            <div className="relative h-[118px] w-full bg-layer-1">
              <div className="absolute inset-0 z-[1]">
                <div className="absolute bottom-4 z-10 flex h-10 w-full items-center justify-between gap-3 px-4">
                  <div className="flex flex-grow items-center gap-2.5 truncate">
                    <span className="size-9 flex-shrink-0 rounded-sm bg-layer-3" />
                    <div className="flex w-full flex-col justify-between gap-0.5 truncate">
                      <span className="h-4 w-28 rounded-sm bg-layer-3" />
                      <span className="h-3 w-16 rounded-sm bg-layer-3" />
                    </div>
                  </div>
                  <div className="flex h-full flex-shrink-0 items-center gap-2">
                    <span className="size-6 rounded-sm bg-layer-3" />
                    <span className="size-6 rounded-sm bg-layer-3" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex h-[104px] w-full flex-col justify-between p-4">
              <span className="h-4 w-36 rounded-sm bg-layer-1" />
              <div className="flex items-center justify-between">
                <span className="h-5 w-20 rounded-sm bg-layer-1" />
                <span className="size-5 rounded-sm bg-layer-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
