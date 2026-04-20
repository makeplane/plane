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

export function RolesAndSchemesListLoader() {
  return (
    <Loader className="flex flex-col gap-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Loader.Item height="24px" width={i === 1 ? "30%" : "40%"} />
          <Loader.Item height="12px" width={i === 1 ? "50%" : "60%"} />
          <Loader.Item height="12px" width={i === 1 ? "40%" : "50%"} />
        </div>
      ))}
    </Loader>
  );
}
