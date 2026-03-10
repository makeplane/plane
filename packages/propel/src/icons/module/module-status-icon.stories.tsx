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

import preview from "#.storybook/preview";
import { ModuleStatusIcon } from "./module-status-icon";
import type { TModuleStatus } from "./module-status-icon";

const meta = preview.meta({
  title: "Media/Icons/Module Status",
  component: ModuleStatusIcon,
  parameters: {
    layout: "centered",
  },
});

const allStatuses: TModuleStatus[] = ["backlog", "planned", "in-progress", "paused", "completed", "cancelled"];

export const AllStatuses = meta.story({
  args: { status: "backlog" },
  render(_args) {
    return (
      <div className="flex items-center gap-4">
        {allStatuses.map((status) => (
          <div key={status} className="flex flex-col items-center gap-1">
            <ModuleStatusIcon status={status} className="size-6" />
            <span className="text-11 text-secondary">{status}</span>
          </div>
        ))}
      </div>
    );
  },
});

export const CustomSize = meta.story({
  args: { status: "completed", height: "24px", width: "24px" },
});
