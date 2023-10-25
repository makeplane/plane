import { FC } from "react";
// components
import { IssueActivityCard } from "./card";
import { IssueCommentEditor } from "./comment-editor";

interface IIssueComment {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  user: any;
  issueComments: any;
  issueCommentCreate: (comment: any) => void;
  issueCommentUpdate: (comment: any) => void;
  issueCommentRemove: (commentId: string) => void;
  issueCommentReactionCreate: (commentId: string, reaction: string) => void;
  issueCommentReactionRemove: (commentId: string, reaction: string) => void;
}

export const IssueComment: FC<IIssueComment> = (props) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    user,
    issueComments,
    issueCommentCreate,
    issueCommentUpdate,
    issueCommentRemove,
    issueCommentReactionCreate,
    issueCommentReactionRemove,
  } = props;

  const handleAddComment = async (formData: any) => {
    if (!formData.comment_html) return;
    await issueCommentCreate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="font-medium text-xl">Activity</div>

      <div className="space-y-2">
        <IssueCommentEditor
          onSubmit={handleAddComment}
          // showAccessSpecifier={projectDetails && projectDetails.is_deployed}
        />

        <IssueActivityCard
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          user={user}
          issueComments={issueComments}
          issueCommentUpdate={issueCommentUpdate}
          issueCommentRemove={issueCommentRemove}
          issueCommentReactionCreate={issueCommentReactionCreate}
          issueCommentReactionRemove={issueCommentReactionRemove}
        />
      </div>
    </div>
  );
};
