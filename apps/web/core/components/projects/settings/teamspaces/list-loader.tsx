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

export function ProjectTeamspaceListLoader() {
  return (
    <div className="divide-y-[0.5px] divide-subtle">
      {range(3).map((i) => (
        <div key={i} className="group grid grid-cols-3 items-center justify-between px-3 py-4">
          <div className="flex items-center gap-x-4">
            <span className="size-7 bg-layer-1 rounded-md" />
            <span className="h-5 w-24 bg-layer-1 rounded" />
          </div>
          <div className="flex -space-x-2">
            {range(3).map((j) => (
              <span key={j} className="size-7 bg-layer-1 rounded-full ring-2 ring-surface-1" />
            ))}
          </div>
          <span className="h-5 w-20 bg-layer-1 rounded" />
        </div>
      ))}
    </div>
  );
}
