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

import { MilestoneIcon } from "@plane/propel/icons";
import { IssueActivityBlockComponent } from "@/components/issues/issue-detail/issue-activity/activity/actions";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type TMilestoneActivityProps = {
  activityId: string;
  ends: "top" | "bottom" | undefined;
};

export function MilestoneActivity(props: TMilestoneActivityProps) {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<MilestoneIcon className="size-3 shrink-0 text-tertiary" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.verb === "created" && (
          <>
            <span>added this work item to the milestone </span>
            <a
              href={`/${activity.workspace_detail?.slug}/projects/${activity.project}/overview`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate font-medium text-primary hover:underline"
            >
              <span className="truncate">{activity.new_value}</span>
            </a>
          </>
        )}
        {activity.verb === "updated" && (
          <>
            <span>changed the milestone to </span>
            <a
              href={`/${activity.workspace_detail?.slug}/projects/${activity.project}/overview`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate font-medium text-primary hover:underline"
            >
              <span className="truncate"> {activity.new_value}</span>
            </a>
            <span> from </span>
            <a
              href={`/${activity.workspace_detail?.slug}/projects/${activity.project}/overview`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate font-medium text-primary hover:underline"
            >
              <span className="truncate"> {activity.old_value}</span>
            </a>
          </>
        )}
        {activity.verb === "deleted" && (
          <>
            <span>removed the work item from the milestone </span>
            <a
              href={`/${activity.workspace_detail?.slug}/projects/${activity.project}/overview`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate font-medium text-primary hover:underline"
            >
              <span className="truncate"> {activity.old_value}</span>
            </a>
          </>
        )}
      </>
    </IssueActivityBlockComponent>
  );
}
