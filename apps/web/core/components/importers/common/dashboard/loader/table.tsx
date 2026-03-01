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

export function DashboardLoaderTable() {
  return (
    <Loader>
      <div className="space-y-4">
        <Loader.Item height="26px" width="20%" />
        {/* table */}
        <div>
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={`${index}`} className=" relative flex items-center">
              {Array.from({ length: 7 }).map((_, childIndex) => (
                <div key={`${index}-${childIndex}`} className="p-1 w-full h-full">
                  <Loader.Item className="" height="28px" width="100%" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Loader>
  );
}
