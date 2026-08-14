/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Timer } from "lucide-react";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { formatWorklogDuration } from "@plane/utils";
import { IssueActivityBlockComponent } from "./";

type TIssueWorklogActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueWorklogActivity = observer(function IssueWorklogActivity(props: TIssueWorklogActivity) {
  const { activityId, ends } = props;
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);
  if (!activity) return <></>;

  const durationLabel = activity.new_value
    ? formatWorklogDuration(Number(activity.new_value))
    : activity.old_value
      ? formatWorklogDuration(Number(activity.old_value))
      : "";

  return (
    <IssueActivityBlockComponent
      icon={<Timer size={14} className="text-secondary" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      {activity.verb === "created" && <span>logged time{durationLabel ? ` (${durationLabel})` : ""}</span>}
      {activity.verb === "updated" && <span>updated logged time{durationLabel ? ` (${durationLabel})` : ""}</span>}
      {activity.verb === "deleted" && (
        <span>
          removed logged time
          {activity.old_value ? ` (${formatWorklogDuration(Number(activity.old_value))})` : ""}
        </span>
      )}
    </IssueActivityBlockComponent>
  );
});
