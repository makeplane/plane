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

export function WorkItemTemplateLoader() {
  return (
    <Loader className="flex flex-col items-center w-full h-full">
      <Loader className="space-y-4 w-full max-w-4xl md:p-9">
        <Loader.Item height="40px" />
        <Loader.Item height="80px" />
      </Loader>
      <Loader className="bg-surface-2 flex flex-col items-center w-full h-full">
        <div className="w-full max-w-4xl md:p-9">
          <div className="space-y-2">
            <div className="flex items-center gap-x-1">
              <Loader.Item height="30px" width="100px" />
              <Loader.Item height="30px" width="100px" />
            </div>
            <Loader className="flex flex-col gap-y-4 py-4 w-full">
              <Loader.Item height="40px" />
              <Loader.Item height="80px" />
            </Loader>
            <Loader className="flex flex-wrap items-center gap-2">
              <Loader.Item height="30px" width="100px" />
              <Loader.Item height="30px" width="100px" />
              <Loader.Item height="30px" width="100px" />
              <Loader.Item height="30px" width="100px" />
              <Loader.Item height="30px" width="100px" />
              <Loader.Item height="30px" width="100px" />
            </Loader>
          </div>
          <Loader className="flex items-center justify-end gap-2 pt-8 mt-8 border-t border-subtle">
            <Loader.Item height="30px" width="100px" />
            <Loader.Item height="30px" width="100px" />
          </Loader>
        </div>
      </Loader>
    </Loader>
  );
}
