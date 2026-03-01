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

import type { FC } from "react";
import { useTheme } from "next-themes";

export function WorklogEmptyScreen() {
  const { resolvedTheme } = useTheme();

  // derived values
  const resolvedEmptyStatePath = `/empty-state/worklogs/worklog-${resolvedTheme === "light" ? "light" : "dark"}.png`;

  return (
    <div className="w-[600px] m-auto mt-12">
      <div className="flex flex-col gap-1.5 flex-shrink">
        <h3 className="text-18 font-semibold">See timesheets for any member in any project.</h3>
        <p className="text-13">
          When you log time via Tracked time in work item properties, you will see detailed timesheets here. Any member
          can log time in any work item in any project in your workspace.
        </p>
      </div>
      <img
        src={resolvedEmptyStatePath}
        alt="Worklog empty state"
        width={384}
        height={250}
        className="my-4 w-full h-full object-cover"
      />
    </div>
  );
}
