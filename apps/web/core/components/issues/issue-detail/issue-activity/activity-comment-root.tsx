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
// plane imports
import { TimelineContainer } from "@plane/blocks/activity";
import type { E_SORT_ORDER, TActivityFilters } from "@plane/constants";
import { filterActivityOnSelectedFilters } from "@plane/constants";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { TCommentsOperations } from "@plane/types";
// hooks
import { useTranslation } from "@plane/i18n";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { ActivityItem } from "./activity-item";
import type { ActivityItemSharedProps } from "./activity-item";
import { IssueActivityLoader } from "./loader";

type IssueActivityCommentRootProps = {
  workspaceSlug: string;
  projectId: string;
  isIntakeIssue: boolean;
  issueId: string;
  selectedFilters: TActivityFilters[];
  activityOperations: TCommentsOperations;
  showAccessSpecifier?: boolean;
  sortOrder: E_SORT_ORDER;
  permissions: {
    comments: {
      canCreate: boolean;
      canEdit: (commentId: string) => boolean;
      canDelete: (commentId: string) => boolean;
      canReact: (commentId: string) => boolean;
    };
  };
  renderMode?: "default" | "transition";
  activeTabKey?: string;
};

export const IssueActivityCommentRoot = observer(function IssueActivityCommentRoot(
  props: IssueActivityCommentRootProps
) {
  const {
    workspaceSlug,
    isIntakeIssue,
    issueId,
    selectedFilters,
    activityOperations,
    showAccessSpecifier,
    projectId,
    permissions,
    sortOrder,
    renderMode = "default",
    activeTabKey = "all",
  } = props;
  // i18n
  const { t } = useTranslation();
  // Map tab keys to their empty state translation keys
  const emptyStateTitleMap: Record<string, string> = {
    all: "activity_empty_state.no_activity",
    activity: "activity_empty_state.no_activity",
    comment: "activity_empty_state.no_comments",
    worklog: "activity_empty_state.no_worklogs",
    transition: "activity_empty_state.no_transitions",
    history: "activity_empty_state.no_history",
  };
  const emptyStateTitle = t(emptyStateTitleMap[activeTabKey] ?? "activity_empty_state.no_activity");
  // store hooks
  const {
    activity: { getActivityAndCommentsByIssueId, getActivityById },
  } = useIssueDetail();
  // derived values
  const activityAndComments = getActivityAndCommentsByIssueId(issueId, sortOrder);

  if (!activityAndComments) return <IssueActivityLoader />;
  if (activityAndComments.length <= 0 && activeTabKey !== "comment") {
    return (
      <div className="py-6">
        <EmptyStateCompact assetKey="unknown" title={emptyStateTitle} />
      </div>
    );
  }

  const filteredActivities = filterActivityOnSelectedFilters(activityAndComments, selectedFilters);

  // In transition mode, exclude activities without meaningful old/new values
  const displayActivities =
    renderMode === "transition"
      ? filteredActivities.filter((item) => {
          if (item.activity_type === "COMMENT" || item.activity_type === "WORKLOG") return true;
          const data = getActivityById(item.id);
          if (!data?.field || data.field === "description") return false;
          return !!(data.old_value || data.new_value);
        })
      : filteredActivities;

  if (displayActivities.length <= 0 && activeTabKey !== "comment") {
    return (
      <div className="py-6">
        <EmptyStateCompact assetKey="unknown" title={emptyStateTitle} />
      </div>
    );
  }

  const sharedProps: ActivityItemSharedProps = {
    workspaceSlug,
    projectId,
    issueId,
    permissions: permissions,
    showAccessSpecifier: !!showAccessSpecifier,
    showCopyLinkOption: !isIntakeIssue,
    activityOperations,
    isTransition: renderMode === "transition",
  };

  return (
    <TimelineContainer>
      {displayActivities.map((item, index) => (
        <ActivityItem
          key={item.id}
          item={item}
          ends={index === 0 ? "top" : index === displayActivities.length - 1 ? "bottom" : undefined}
          showConnector={index < displayActivities.length - 1}
          {...sharedProps}
        />
      ))}
    </TimelineContainer>
  );
});
