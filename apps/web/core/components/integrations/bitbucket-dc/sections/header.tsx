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

import BitbucketLogo from "@/app/assets/services/bitbucket.svg?url";

export function BitbucketHeader() {
  return (
    <div className="flex-shrink-0 relative flex items-center gap-4 rounded-sm bg-layer-1 p-4">
      <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
        <img src={BitbucketLogo} alt="Bitbucket Logo" className="w-full h-full object-cover" />
      </div>
      <div>
        <div className="text-body-sm-medium">Bitbucket Data Center</div>
        <div className="text-body-xs-regular text-secondary">
          Sync pull requests with Plane issues and automate state transitions.
        </div>
      </div>
    </div>
  );
}
