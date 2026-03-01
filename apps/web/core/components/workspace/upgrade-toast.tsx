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

import { PlaneLogo } from "@plane/propel/icons";

export function UpgradeToast() {
  return (
    <div className="flex gap-2 px-2">
      <div className="flex-shrink-0 pt-1.5">
        <PlaneLogo className="h-3 w-auto text-accent-primary" />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="text-13 font-medium leading-5">Upgrade</div>
        <div className="text-secondary">Get this feature when you upgrade to Pro.</div>
      </div>
    </div>
  );
}
