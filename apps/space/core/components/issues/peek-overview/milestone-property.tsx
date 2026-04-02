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

import { observer } from "mobx-react";
import { MilestoneIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { getMilestoneIconProps, getMilestoneProgressPercentage } from "@plane/utils";
import { useMilestone } from "@/hooks/store/use-milestone";

type PeekOverviewMilestonePropertyProps = {
  milestoneId: string | undefined;
};

// TODO-@plane/blocks PeekOverviewMilestoneProperty
export const PeekOverviewMilestoneProperty = observer(function PeekOverviewMilestoneProperty({
  milestoneId,
}: PeekOverviewMilestonePropertyProps) {
  const { getMilestoneById } = useMilestone();
  const milestone = getMilestoneById(milestoneId);
  const milestoneIconProps = milestone
    ? getMilestoneIconProps(getMilestoneProgressPercentage(milestone.progress))
    : null;

  return (
    <div className="flex items-center gap-3 h-8">
      <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-13 text-tertiary">
        <MilestoneIcon className="size-4 flex-shrink-0" />
        <span>Milestone</span>
      </div>
      <div className="w-3/4">
        {milestone ? (
          <Tooltip tooltipContent={milestone.name}>
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-sm border-[0.5px] border-strong px-2.5 py-0.5 text-13">
              <MilestoneIcon className="size-3 flex-shrink-0" {...milestoneIconProps} />
              <span className="truncate">{milestone.name}</span>
            </div>
          </Tooltip>
        ) : (
          <span className="text-secondary text-13">Empty</span>
        )}
      </div>
    </div>
  );
});
