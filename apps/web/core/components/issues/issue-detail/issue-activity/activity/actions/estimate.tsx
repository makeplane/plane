/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { EstimatePropertyIcon } from "@plane/propel/icons";
import { convertMinutesToHoursMinutesString } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";

type TIssueEstimateActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueEstimateActivity = observer(function IssueEstimateActivity(props: TIssueEstimateActivity) {
  const { activityId, showIssue = true, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  // TIME estimates store the raw minutes count — render it as "Xh Ym" like
  // every other estimate surface (mirrors the notification card handler)
  const formatValue = (value: string) =>
    activity.field === "estimate_time" && value && !isNaN(Number(value))
      ? convertMinutesToHoursMinutesString(Number(value))
      : value;

  return (
    <IssueActivityBlockComponent
      icon={<EstimatePropertyIcon className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.new_value ? `set the estimate point to ` : `removed the estimate point`}
        {activity.new_value ? formatValue(activity.new_value) : formatValue(activity?.old_value ?? "")}
        {showIssue && (activity.new_value ? ` to ` : ` from `)}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
