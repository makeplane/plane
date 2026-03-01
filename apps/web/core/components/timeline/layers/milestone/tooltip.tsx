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
// plane imports
import { CircularProgressIndicator } from "@plane/ui";
import { WorkItemsIcon } from "@plane/propel/icons";

type Props = {
  title: string;
  workItemsCount: number;
  progress: number;
  mouseY: number;
};

export const MilestoneTooltip: FC<Props> = function MilestoneTooltip({ title, workItemsCount, progress, mouseY }) {
  return (
    <div
      className="absolute left-2 bg-surface-1 border border-subtle-1 rounded-md shadow-raised-300 px-3 py-2 min-w-[200px]"
      style={{
        top: `${mouseY + 22}px`,
        transform: "translateY(-50%)",
      }}
    >
      <div className="flex flex-col gap-2">
        {/* Title */}
        <p className="text-body-xs-medium text-primary truncate">{title}</p>

        {/* Progress and work items */}
        <div className="space-y-3 text-caption-sm-regular">
          <div className="flex items-center gap-1.5">
            <CircularProgressIndicator size={16} percentage={progress} strokeWidth={3} />
            <span className="text-secondary text-caption-sm-medium">{Math.round(progress)}% Progress</span>
          </div>
          <div className="flex gap-2">
            <WorkItemsIcon className="size-4 text-secondary" />
            <span className="text-secondary text-caption-sm-medium">
              {workItemsCount} work item{workItemsCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
