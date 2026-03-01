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

// plane imports
import { Loader } from "@plane/ui";

export function DashboardsListLayoutLoader() {
  return (
    <div className="size-full">
      {Array.from({ length: 10 }).map((_, index) => (
        <Loader key={index} className="relative flex items-center gap-2 p-3 py-4 border-b border-subtle-1">
          <Loader.Item width={`${250 + 10 * Math.floor(Math.random() * 10)}px`} height="22px" />
          <div className="ml-auto relative flex items-center gap-2">
            <Loader.Item width="60px" height="22px" />
            <Loader.Item width="22px" height="22px" />
            <Loader.Item width="22px" height="22px" />
            <Loader.Item width="22px" height="22px" />
          </div>
        </Loader>
      ))}
    </div>
  );
}
