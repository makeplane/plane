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

export function AutomationActivityLoader() {
  return (
    <Loader className="space-y-8 px-6">
      <div className="flex items-start gap-3">
        <Loader.Item className="shrink-0" height="28px" width="28px" />
        <div className="space-y-2 w-full">
          <Loader.Item height="8px" width="60%" />
          <Loader.Item height="8px" width="40%" />
          <Loader.Item height="10px" width="100%" />
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Loader.Item className="shrink-0" height="28px" width="28px" />
        <div className="space-y-2 w-full">
          <Loader.Item height="8px" width="40%" />
          <Loader.Item height="8px" width="60%" />
          <Loader.Item height="10px" width="80%" />
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Loader.Item className="shrink-0" height="28px" width="28px" />
        <div className="space-y-2 w-full">
          <Loader.Item height="8px" width="60%" />
          <Loader.Item height="8px" width="40%" />
          <Loader.Item height="10px" width="100%" />
        </div>
      </div>
    </Loader>
  );
}
