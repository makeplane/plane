import { FC } from "react";
import { observer } from "mobx-react";
// constants
import { E_SORT_ORDER, TActivityFilters, filterActivityOnSelectedFilters } from "@plane/constants";
// hooks
import { TCommentsOperations } from "@plane/types";
import { CommentCard } from "@/components/comments/comment-card";
import { useIssueDetail } from "@/hooks/store";
// plane web components
import { IssueAdditionalPropertiesActivity } from "@/plane-web/components/issues";
import { IssueActivityWorklog } from "@/plane-web/components/issues/worklog/activity/root";
// components
import { IssueActivityItem } from "./activity/activity-list";

type TIssueActivityCommentRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  selectedFilters: TActivityFilters[];
  activityOperations: TCommentsOperations;
  showAccessSpecifier?: boolean;
  disabled?: boolean;
  sortOrder: E_SORT_ORDER;
};

export const IssueActivityCommentRoot: FC<TIssueActivityCommentRoot> = observer((props) => {
  const {
    workspaceSlug,
    issueId,
    selectedFilters,
    activityOperations,
    showAccessSpecifier,
    projectId,
    disabled,
    sortOrder,
  } = props;
  // hooks
  const {
    activity: { getActivityCommentByIssueId },
    comment: { getCommentById },
  } = useIssueDetail();

  const activityComments = getActivityCommentByIssueId(issueId, sortOrder);

  if (!activityComments || (activityComments && activityComments.length <= 0)) return <></>;

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments, selectedFilters);

  return (
    <div>
      {filteredActivityComments.map((activityComment, index) => {
        const comment = getCommentById(activityComment.id);
        return activityComment.activity_type === "COMMENT" ? (
          <CommentCard
            key={activityComment.id}
            workspaceSlug={workspaceSlug}
            comment={comment}
            activityOperations={activityOperations}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
            showAccessSpecifier={showAccessSpecifier}
            disabled={disabled}
            projectId={projectId}
          />
        ) : activityComment.activity_type === "ACTIVITY" ? (
          <IssueActivityItem
            activityId={activityComment.id}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
          />
        ) : activityComment.activity_type === "ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY" ? (
          <IssueAdditionalPropertiesActivity
            activityId={activityComment.id}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
          />
        ) : activityComment.activity_type === "WORKLOG" ? (
          <IssueActivityWorklog
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            activityComment={activityComment}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
          />
        ) : (
          <></>
        );
      })}
    </div>
  );
});
