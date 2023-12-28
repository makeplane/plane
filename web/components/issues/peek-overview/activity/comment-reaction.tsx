import { FC } from "react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// components
import { IssuePeekOverviewReactions } from "components/issues";
import { useIssueDetail } from "hooks/store";

interface IIssueCommentReaction {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  user: any;

  comment: any;
  issueCommentReactionCreate: (commentId: string, reaction: string) => void;
  issueCommentReactionRemove: (commentId: string, reaction: string) => void;
}

export const IssueCommentReaction: FC<IIssueCommentReaction> = observer((props) => {
  const { workspaceSlug, projectId, issueId, user, comment, issueCommentReactionCreate, issueCommentReactionRemove } =
    props;

  const issueDetail = useIssueDetail();

  const handleCommentReactionCreate = (reaction: string) => {
    if (issueCommentReactionCreate && comment?.id) issueCommentReactionCreate(comment?.id, reaction);
  };

  const handleCommentReactionRemove = (reaction: string) => {
    if (issueCommentReactionRemove && comment?.id) issueCommentReactionRemove(comment?.id, reaction);
  };

  useSWR(
    workspaceSlug && projectId && issueId && comment && comment?.id
      ? `ISSUE+PEEK_OVERVIEW_COMMENT_${comment?.id}`
      : null,
    () => {
      if (workspaceSlug && projectId && issueId && comment && comment.id) {
        issueDetail.fetchCommentReactions(workspaceSlug, projectId, comment?.id);
      }
    }
  );

  const issueReactions = issueDetail?.commentReaction.getCommentReactionsByCommentId(comment.id) || null;

  return (
    <div>
      <IssuePeekOverviewReactions
        issueReactions={issueReactions}
        user={user}
        issueReactionCreate={handleCommentReactionCreate}
        issueReactionRemove={handleCommentReactionRemove}
        position="top"
      />
    </div>
  );
});
