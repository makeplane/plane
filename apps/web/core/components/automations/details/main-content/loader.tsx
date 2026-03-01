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

export function AutomationDetailsMainContentLoader() {
  return (
    <>
      {/* Header Section */}
      <Loader className="space-y-3 mb-2">
        <Loader className="flex items-center justify-between gap-2">
          <Loader.Item height="28px" width="200px" />
          <Loader.Item height="16px" width="16px" />
        </Loader>
        <Loader.Item height="16px" width="300px" />
      </Loader>
      {/* Scope Section */}
      {/* <Loader className="space-y-5">
        <Loader className="flex items-center gap-4">
          <Loader.Item height="20px" width="50px" />
          <Loader className="flex-grow">
            <Loader.Item height="1px" width="100%" />
          </Loader>
          <Loader.Item height="16px" width="16px" />
        </Loader>

        <Loader className="p-5 space-y-3 bg-surface-1 rounded-lg shadow-raised-100 border border-transparent">
          <Loader.Item height="16px" width="60px" />
          <Loader className="flex items-center gap-2">
            <Loader.Item height="48px" width="48px" className="rounded-full" />
            <Loader.Item height="20px" width="80px" />
          </Loader>
        </Loader>
      </Loader> */}
      {/* Trigger Section */}
      <Loader className="space-y-5">
        <Loader className="flex items-center gap-4">
          <Loader.Item height="20px" width="60px" />
          <Loader className="flex-grow">
            <Loader.Item height="1px" width="100%" />
          </Loader>
          <Loader.Item height="16px" width="16px" />
        </Loader>
        <Loader className="flex items-start gap-4">
          <Loader.Item height="32px" width="32px" className="rounded-full" />
          <Loader className="flex-grow p-5 space-y-3 bg-surface-1 rounded-lg shadow-raised-100 border border-transparent">
            <Loader.Item height="16px" width="20px" />
            <Loader className="flex items-center gap-1.5">
              <Loader.Item height="16px" width="16px" />
              <Loader.Item height="20px" width="180px" />
            </Loader>
          </Loader>
        </Loader>
      </Loader>
      {/* Actions Section */}
      <Loader className="space-y-5">
        <Loader className="flex items-center gap-4">
          <Loader.Item height="20px" width="50px" />
          <Loader className="flex-grow">
            <Loader.Item height="1px" width="100%" />
          </Loader>
          <Loader.Item height="16px" width="16px" />
        </Loader>
        <Loader className="flex items-start gap-4">
          <Loader.Item height="32px" width="32px" className="rounded-full" />
          <Loader className="flex-grow p-5 space-y-7 bg-surface-1 rounded-lg shadow-raised-100 border border-transparent">
            <Loader.Item height="16px" width="40px" />
            <Loader className="flex items-center gap-2">
              <Loader.Item height="48px" width="48px" className="rounded-full" />
              <Loader className="space-y-1">
                <Loader.Item height="20px" width="100px" />
                <Loader.Item height="16px" width="140px" />
              </Loader>
            </Loader>
            <Loader.Item height="16px" width="30px" />
            <Loader className="flex items-center gap-2">
              <Loader.Item height="48px" width="48px" className="rounded-full" />
              <Loader className="space-y-1">
                <Loader.Item height="20px" width="100px" />
                <Loader.Item height="16px" width="140px" />
              </Loader>
            </Loader>
          </Loader>
        </Loader>
      </Loader>
    </>
  );
}
