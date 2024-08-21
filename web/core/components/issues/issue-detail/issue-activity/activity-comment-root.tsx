import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web components
import { IssueAdditionalPropertiesActivity } from "@/plane-web/components/issues";
import { IssueActivityWorklog } from "@/plane-web/components/issues/worklog/activity/root";
// plane web constants
import { TActivityFilters, filterActivityOnSelectedFilters } from "@/plane-web/constants/issues";
// components
import { IssueActivityItem } from "./activity/activity-list";
import { IssueCommentCard } from "./comments/comment-card";
// types
import { TActivityOperations } from "./root";

type TIssueActivityCommentRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  selectedFilters: TActivityFilters[];
  activityOperations: TActivityOperations;
  showAccessSpecifier?: boolean;
  disabled?: boolean;
};

export const IssueActivityCommentRoot: FC<TIssueActivityCommentRoot> = observer((props) => {
  const { workspaceSlug, issueId, selectedFilters, activityOperations, showAccessSpecifier, projectId, disabled } =
    props;
  // hooks
  const {
    activity: { getActivityCommentByIssueId },
    comment: {},
  } = useIssueDetail();

  const activityComments = getActivityCommentByIssueId(issueId);

  if (!activityComments || (activityComments && activityComments.length <= 0)) return <></>;

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments, selectedFilters);

  return (
    <div>
      {filteredActivityComments.map((activityComment, index) =>
        activityComment.activity_type === "COMMENT" ? (
          <IssueCommentCard
            projectId={projectId}
            key={activityComment.id}
            workspaceSlug={workspaceSlug}
            commentId={activityComment.id}
            activityOperations={activityOperations}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
            showAccessSpecifier={showAccessSpecifier}
            disabled={disabled}
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
        )
      )}
    </div>
  );
});
