/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import type { E_SORT_ORDER, TActivityFilters } from "@plane/constants";
import { BASE_ACTIVITY_FILTER_TYPES, EActivityFilterType, filterActivityOnSelectedFilters } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TCommentsOperations } from "@plane/types";
// components
import { CommentCard } from "@/components/comments/card/root";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { IssueActivityItem } from "./activity/activity-list";
import { IssueActivityLoader } from "./loader";

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
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    activity: { getActivityAndCommentsByIssueId },
    comment: { getCommentById },
  } = useIssueDetail();
  // derived values
  const activityAndComments = getActivityAndCommentsByIssueId(issueId, sortOrder);

  if (!activityAndComments) return <IssueActivityLoader />;

  const filteredActivityAndComments = filterActivityOnSelectedFilters(activityAndComments, selectedFilters);

  if (filteredActivityAndComments.length <= 0) {
    const isCommentsOnly = selectedFilters.every((filter) => filter === EActivityFilterType.COMMENT);
    return (
      <div className="py-6">
        <EmptyStateCompact
          assetKey={isCommentsOnly ? "comment" : "activity"}
          title={t(isCommentsOnly ? "activity_empty_state.no_comments" : "activity_empty_state.no_activity")}
        />
      </div>
    );
  }

  // the last entry ends the timeline rail
  const getEnds = (index: number) =>
    index === filteredActivityAndComments.length - 1 ? "bottom" : index === 0 ? "top" : undefined;

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
            ends={getEnds(index)}
            showAccessSpecifier={!!showAccessSpecifier}
            showCopyLinkOption={!isIntakeIssue}
            disabled={disabled}
            projectId={projectId}
            enableReplies
          />
        ) : BASE_ACTIVITY_FILTER_TYPES.includes(activityComment.activity_type as EActivityFilterType) ? (
          <IssueActivityItem key={activityComment.id} activityId={activityComment.id} ends={getEnds(index)} />
        ) : null;
      })}
    </div>
  );
});
