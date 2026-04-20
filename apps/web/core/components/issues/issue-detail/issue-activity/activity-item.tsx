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

import { BASE_ACTIVITY_FILTER_TYPES } from "@plane/constants";
import type { TCommentsOperations, TIssueActivityComment } from "@plane/types";
// components
import { IssueActivityWorklog } from "@/components/issues/worklog/activity/root";
// local imports
import { IssueActivityItem } from "./activity/activity-list";
import { WorkItemCustomPropertiesActivity } from "./activity/custom-properties-activity";
import { ActivityCommentItem } from "./activity-comment-item";
import { IssueActivityTransitionItem } from "./activity-transition-item";

export type ActivityItemSharedProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  permissions: {
    comments: {
      canCreate: boolean;
      canEdit: (commentId: string) => boolean;
      canDelete: (commentId: string) => boolean;
      canReact: (commentId: string) => boolean;
    };
  };
  showAccessSpecifier: boolean;
  showCopyLinkOption: boolean;
  activityOperations: TCommentsOperations;
  isTransition: boolean;
};

type ActivityItemProps = ActivityItemSharedProps & {
  item: TIssueActivityComment;
  ends: "top" | "bottom" | undefined;
  showConnector: boolean;
};

export function ActivityItem(props: ActivityItemProps) {
  const {
    item,
    ends,
    showConnector,
    isTransition,
    workspaceSlug,
    projectId,
    issueId,
    permissions,
    showAccessSpecifier,
    showCopyLinkOption,
    activityOperations,
  } = props;
  const { id, activity_type } = item;

  if (activity_type === "COMMENT") {
    return (
      <ActivityCommentItem
        commentId={id}
        workspaceSlug={workspaceSlug}
        issueId={issueId}
        projectId={projectId}
        permissions={{
          canCreate: permissions.comments.canCreate,
          canEdit: permissions.comments.canEdit(id),
          canDelete: permissions.comments.canDelete(id),
          canReact: permissions.comments.canReact(id),
        }}
        showAccessSpecifier={showAccessSpecifier}
        showCopyLinkOption={showCopyLinkOption}
        showConnector={showConnector}
        activityOperations={activityOperations}
      />
    );
  }

  if (activity_type === "WORKLOG") {
    return (
      <IssueActivityWorklog
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        activityComment={item}
        ends={ends}
      />
    );
  }

  const isBaseActivity = (BASE_ACTIVITY_FILTER_TYPES as readonly string[]).includes(activity_type);
  const isCustomProperty = activity_type === "ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY";

  if (isBaseActivity || isCustomProperty) {
    if (isTransition) return <IssueActivityTransitionItem activityId={id} ends={ends} isLast={!showConnector} />;
    if (isCustomProperty) return <WorkItemCustomPropertiesActivity activityId={id} ends={ends} />;
    return <IssueActivityItem activityId={id} ends={ends} />;
  }

  return null;
}
