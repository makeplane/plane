import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { IssueCommentCard } from "./comment-card";
// types
import { TActivityOperations } from "../root";

type TIssueCommentRoot = {
  issueId: string;
  activityOperations: TActivityOperations;
  showAccessSpecifier?: boolean;
};

export const IssueCommentRoot: FC<TIssueCommentRoot> = observer((props) => {
  const { issueId, activityOperations, showAccessSpecifier } = props;
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
          commentId={commentId}
          ends={index === 0 ? "top" : index === commentIds.length - 1 ? "bottom" : undefined}
          activityOperations={activityOperations}
          showAccessSpecifier={showAccessSpecifier}
        />
      ))}
    </div>
  );
});
