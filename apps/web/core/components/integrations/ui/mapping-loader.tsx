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

import { Loader } from "@plane/ui";

export function MappingLoader() {
  return (
    <div className="relative w-full space-y-4">
      <div className="border border-subtle rounded-md overflow-hidden">
        <Loader>
          {/* Header skeleton */}
          <div className="flex flex-row items-center justify-between py-3 px-4 bg-layer-1 border-b border-subtle">
            <div className="space-y-1">
              <Loader.Item height="24px" width="180px" />
              <Loader.Item height="18px" width="280px" />
            </div>
            <Loader.Item height="32px" width="32px" className="rounded" />
          </div>

          {/* Content skeleton */}
          <div className="p-4 bg-surface-1">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex border border-subtle rounded-md p-3 gap-4">
                  <Loader.Item height="36px" width="100%" />
                  <Loader.Item height="32px" width="32px" className="rounded-full shrink-0" />
                  <Loader.Item height="36px" width="100%" />
                </div>
              ))}
            </div>
          </div>
        </Loader>
      </div>
    </div>
  );
}
