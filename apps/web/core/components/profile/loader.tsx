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

export function ConnectionLoader() {
  return (
    <div className="flex flex-col border border-subtle-1 rounded p-4 mb-2 justify-center">
      {/* Icon and Title Section */}
      <div className="flex items-center gap-1">
        <Loader>
          <Loader.Item height="32px" width="32px" />
        </Loader>
        <Loader>
          <Loader.Item height="24px" width="80px" />
        </Loader>
      </div>
      {/* Description Section */}
      <div className="pt-2 pb-4">
        <Loader>
          <Loader.Item height="16px" width="100%" />
        </Loader>
      </div>
      {/* Connection Status Section */}
      <div className="rounded p-2 flex justify-between items-center border-[1px] border-subtle">
        <div className="flex-1">
          <Loader>
            <Loader.Item height="16px" width="80%" />
          </Loader>
        </div>
        <Loader>
          <Loader.Item height="24px" width="64px" />
        </Loader>
      </div>
    </div>
  );
}
