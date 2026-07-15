/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TActivityFilters, EActivityFilterType } from "@plane/constants";
import { BASE_ACTIVITY_FILTER_TYPES, E_SORT_ORDER, filterActivityOnSelectedFilters } from "@plane/constants";
import type { TCommentsOperations, TIssueActivityComment } from "@plane/types";
// components
import { CommentCard } from "@/components/comments/card/root";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// services
import { IssueService } from "@/services/issue";
// plane web components
import { IssueAdditionalPropertiesActivity } from "@/plane-web/components/issues/issue-details/issue-properties-activity";
import { IssueActivityWorklog } from "@/plane-web/components/issues/worklog/activity/root";
// local imports
import { IssueActivityItem } from "./activity/activity-list";
import { IssueActivityLoader } from "./loader";

type TTimeLog = {
  id: string;
  created_at: string;
  stopped_at: string | null;
  duration_seconds: number;
  user_detail: { id: string; display_name: string } | null;
  created_by_detail: { id: string; display_name: string } | null;
};

type TIssueActivityCommentRoot = {
  workspaceSlug: string;
  projectId: string;
  isIntakeIssue: boolean;
  issueId: string;
  selectedFilters: TActivityFilters[];
  activityOperations: TCommentsOperations;
  showAccessSpecifier?: boolean;
  disabled?: boolean;
  sortOrder: E_SORT_ORDER;
};

export const IssueActivityCommentRoot = observer(function IssueActivityCommentRoot(props: TIssueActivityCommentRoot) {
  const {
    workspaceSlug,
    isIntakeIssue,
    issueId,
    selectedFilters,
    activityOperations,
    showAccessSpecifier,
    projectId,
    disabled,
    sortOrder,
  } = props;
  // store hooks
  const {
    activity: { getActivityAndCommentsByIssueId },
    comment: { getCommentById },
  } = useIssueDetail();
  const [timeLogs, setTimeLogs] = useState<TTimeLog[] | undefined>();
  const [timeLogsRevision, setTimeLogsRevision] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const issueService = new IssueService();

    issueService
      .getTimeLogs(workspaceSlug, projectId, issueId)
      .then((logs) => {
        if (isMounted) setTimeLogs(logs);
        return logs;
      })
      .catch(() => {
        if (isMounted) setTimeLogs([]);
        return [];
      });

    return () => {
      isMounted = false;
    };
  }, [workspaceSlug, projectId, issueId, timeLogsRevision]);

  useEffect(() => {
    const handleTimeLogsChanged = (event: Event) => {
      if ((event as CustomEvent<{ issueId: string }>).detail.issueId === issueId) {
        setTimeLogsRevision((revision) => revision + 1);
      }
    };

    window.addEventListener("plane:time-logs-changed", handleTimeLogsChanged);
    return () => window.removeEventListener("plane:time-logs-changed", handleTimeLogsChanged);
  }, [issueId]);
  // derived values
  const activityAndComments = getActivityAndCommentsByIssueId(issueId, sortOrder);

  if (!activityAndComments || !timeLogs) return <IssueActivityLoader />;

  const worklogActivities: TIssueActivityComment[] = timeLogs
    .filter((timeLog) => timeLog.stopped_at)
    .map((timeLog) => ({
      id: timeLog.id,
      activity_type: "WORKLOG",
      created_at: timeLog.created_by_detail ? timeLog.created_at : timeLog.stopped_at || timeLog.created_at,
    }));
  // eslint-disable-next-line unicorn/no-array-sort -- toSorted() is ES2023, unsupported by this app's tsconfig lib target
  const allActivities = [...activityAndComments, ...worklogActivities].sort((a, b) => {
    const difference = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    return sortOrder === E_SORT_ORDER.ASC ? difference : -difference;
  });

  if (allActivities.length <= 0) return null;

  const filteredActivityAndComments = filterActivityOnSelectedFilters(allActivities, selectedFilters);

  return (
    <div>
      {filteredActivityAndComments.map((activityComment, index) => {
        const comment = getCommentById(activityComment.id);
        return activityComment.activity_type === "COMMENT" ? (
          <CommentCard
            key={activityComment.id}
            workspaceSlug={workspaceSlug}
            entityId={issueId}
            comment={comment}
            activityOperations={activityOperations}
            ends={index === 0 ? "top" : index === filteredActivityAndComments.length - 1 ? "bottom" : undefined}
            showAccessSpecifier={!!showAccessSpecifier}
            showCopyLinkOption={!isIntakeIssue}
            disabled={disabled}
            projectId={projectId}
            enableReplies
          />
        ) : BASE_ACTIVITY_FILTER_TYPES.includes(activityComment.activity_type as EActivityFilterType) ? (
          <IssueActivityItem
            key={activityComment.id}
            activityId={activityComment.id}
            ends={index === 0 ? "top" : index === filteredActivityAndComments.length - 1 ? "bottom" : undefined}
          />
        ) : activityComment.activity_type === "ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY" ? (
          <IssueAdditionalPropertiesActivity
            key={activityComment.id}
            activityId={activityComment.id}
            ends={index === 0 ? "top" : index === filteredActivityAndComments.length - 1 ? "bottom" : undefined}
          />
        ) : activityComment.activity_type === "WORKLOG" ? (
          <IssueActivityWorklog
            key={activityComment.id}
            timeLog={timeLogs.find((timeLog) => timeLog.id === activityComment.id)}
            ends={index === 0 ? "top" : index === filteredActivityAndComments.length - 1 ? "bottom" : undefined}
          />
        ) : (
          <></>
        );
      })}
    </div>
  );
});
