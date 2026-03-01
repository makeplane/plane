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

import { range } from "lodash-es";
import { Loader } from "@plane/ui";

export function CustomerLoader() {
  return (
    <Loader className="h-full overflow-y-auto">
      <div className="flex h-full w-full justify-between">
        <div className="flex h-full w-full flex-col overflow-y-auto">
          {range(5).map((i) => (
            <div
              key={i}
              className="flex w-full items-center justify-between gap-5 border-b border-subtle-1 flex-col sm:flex-row px-5 py-4"
            >
              <div className="relative flex w-full items-center gap-3 justify-between overflow-hidden">
                <div className="relative w-full flex items-center gap-3 overflow-hidden">
                  <div className="flex items-center gap-4 truncate">
                    <Loader.Item height="40px" width="40px" className="rounded-xl" />
                    <div className="flex flex-col space-y-2">
                      <Loader.Item height="16px" width="80px" />
                      <Loader.Item height="8px" width="80px" />
                    </div>
                  </div>
                </div>
                <Loader.Item height="24px" width="80px" />
              </div>
              <div className="flex w-full sm:w-auto relative overflow-hidden items-center gap-2.5 justify-between sm:justify-end sm:flex-shrink-0 ">
                <div className="flex-shrink-0 relative flex items-center gap-3">
                  <Loader.Item height="20pxs" width="20px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Loader>
  );
}
