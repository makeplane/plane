import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { IssueCommentCard } from "./comment-card";
// types
import { TActivityOperations } from "../root";

type TIssueCommentRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityOperations: TActivityOperations;
  disabled: boolean;
};

export const IssueCommentRoot: FC<TIssueCommentRoot> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled, activityOperations } = props;
  // hooks
  const {
    comment: { getCommentsByIssueId },
  } = useIssueDetail();

  const commentIds = getCommentsByIssueId(issueId);

  if (!commentIds) return <></>;
  return (
    <div>
      {commentIds.map((commentId, index) => (
        <IssueCommentCard
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          commentId={commentId}
          disabled={disabled}
          ends={index === 0 ? "top" : index === commentIds.length - 1 ? "bottom" : undefined}
          activityOperations={activityOperations}
        />
      ))}
    </div>
  );
});
