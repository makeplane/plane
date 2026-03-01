/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

export function TeamsLoader() {
  return (
    <div className="h-full overflow-y-auto animate-pulse">
      <div className="flex h-full w-full justify-between">
        <div className="flex h-full w-full flex-col overflow-y-auto">
          {[...Array(5)].map((i) => (
            <div
              key={i}
              className="flex w-full items-center justify-between gap-5 border-b border-subtle flex-col sm:flex-row px-7 py-4"
            >
              <div className="relative flex w-full items-center gap-3 justify-between overflow-hidden">
                <div className="relative w-full flex items-center gap-3 overflow-hidden">
                  <div className="flex items-center gap-4 truncate">
                    <span className="size-7 bg-layer-1 rounded-md" />
                    <span className="h-5 w-20 bg-layer-1 rounded" />
                  </div>
                </div>
                <span className="size-7 bg-layer-1 rounded-full" />
              </div>
              <div className="flex w-full sm:w-auto relative overflow-hidden items-center gap-2.5 justify-between sm:justify-end sm:flex-shrink-0 ">
                <div className="flex-shrink-0 relative flex items-center gap-3">
                  <span className="h-7 w-20 bg-layer-1 rounded-full" />
                  <span className="h-6 w-6 bg-layer-1 rounded" />
                  <span className="h-3 w-6 bg-layer-1 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
