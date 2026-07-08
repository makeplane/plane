/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { TransferIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssue, TIssueActivity } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

export const TransferHopInfo = observer(function TransferHopInfo({ workItem }: { workItem: TIssue }) {
  // store hooks
  const {
    activity: { getActivitiesByIssueId, getActivityById },
  } = useIssueDetail();

  // derived values
  const activityIds = getActivitiesByIssueId(workItem.id) ?? [];
  const transferHops = activityIds
    .map((activityId) => getActivityById(activityId))
    .filter(
      (activity): activity is TIssueActivity =>
        !!activity &&
        activity.field === "cycles" &&
        activity.verb === "updated" &&
        !!activity.old_identifier &&
        !!activity.new_identifier &&
        activity.old_identifier !== activity.new_identifier
    );

  if (transferHops.length === 0) return <></>;

  return (
    <Tooltip
      tooltipHeading="Cycle transfers"
      tooltipContent={
        <span className="flex flex-col gap-1">
          {transferHops.map((hop) => (
            <span key={hop.id} className="truncate">
              {hop.old_value} → {hop.new_value}
            </span>
          ))}
        </span>
      }
    >
      <span className="grid flex-shrink-0 place-items-center">
        <TransferIcon className="h-3 w-3 text-tertiary" />
      </span>
    </Tooltip>
  );
});
