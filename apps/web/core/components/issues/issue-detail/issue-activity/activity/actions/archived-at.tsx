/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ArchiveOutline, RefreshOutline } from "@makeplane/propel/icons";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent } from "./";
// ui

type TIssueArchivedAtActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueArchivedAtActivity = observer(function IssueArchivedAtActivity(props: TIssueArchivedAtActivity) {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  return (
    <IssueActivityBlockComponent
      icon={
        activity.new_value === "restore" ? (
          <RefreshOutline className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
        ) : (
          <ArchiveOutline className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
        )
      }
      activityId={activityId}
      ends={ends}
      customUserName={activity.new_value === "archive" ? "Plane" : undefined}
    >
      {activity.new_value === "restore" ? "restored the work item" : "archived the work item"}.
    </IssueActivityBlockComponent>
  );
});
