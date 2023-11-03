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
  showCommentAccessSpecifier: boolean;
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
    showCommentAccessSpecifier,
  } = props;

  const handleAddComment = async (formData: any) => {
    if (!formData.comment_html) return;
    await issueCommentCreate(formData);
  };

  return (
    <div className="flex flex-col gap-3 border-t py-6 border-custom-border-200">
      <div className="font-medium text-lg">Activity</div>

      <div className="space-y-2">
        <IssueCommentEditor onSubmit={handleAddComment} showAccessSpecifier={showCommentAccessSpecifier} />

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
