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

import { TriangleAlertIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import type { TIssue } from "@plane/types";

export type TDateAlertProps = {
  date: string;
  workItem: TIssue;
  projectId: string;
};

export function DateAlert(props: TDateAlertProps) {
  const { date, workItem, projectId } = props;

  // store hooks
  const { getMilestoneById } = useMilestones();

  if (!workItem.milestone_id) return null;

  const milestone = getMilestoneById(projectId, workItem.milestone_id);

  if (!milestone || !milestone.target_date) return null;

  const isWorkItemDatePast = new Date(date) > new Date(milestone.target_date);

  if (!isWorkItemDatePast) return null;

  return (
    <Tooltip
      tooltipContent="End date is after the milestone target. You can update to stay on track."
      position="bottom-end"
    >
      <span className="inline-flex cursor-pointer">
        <TriangleAlertIcon className="size-4 text-[#FE9A00]" />
      </span>
    </Tooltip>
  );
}
