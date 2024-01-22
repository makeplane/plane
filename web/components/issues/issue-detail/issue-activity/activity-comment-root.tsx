import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { IssueActivityList } from "./activity/activity-list";
import { IssueCommentCard } from "./comments/comment-card";

type TIssueActivityCommentRoot = { workspaceSlug: string; projectId: string; issueId: string; disabled: boolean };

export const IssueActivityCommentRoot: FC<TIssueActivityCommentRoot> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  // hooks
  const {
    activity: { getActivityCommentByIssueId },
    comment: {},
  } = useIssueDetail();

  const activityComments = getActivityCommentByIssueId(issueId);

  if (!activityComments || (activityComments && activityComments.length <= 0)) return <></>;
  return (
    <div>
      {activityComments.map((activityComment, index) =>
        activityComment.activity_type === "COMMENT" ? (
          <IssueCommentCard
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            commentId={activityComment.id}
            disabled={disabled}
            ends={index === 0 ? "top" : index === activityComments.length - 1 ? "bottom" : undefined}
          />
        ) : activityComment.activity_type === "ACTIVITY" ? (
          <IssueActivityList
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            activityId={activityComment.id}
            disabled={disabled}
            ends={index === 0 ? "top" : index === activityComments.length - 1 ? "bottom" : undefined}
          />
        ) : (
          <></>
        )
      )}
    </div>
  );
});
