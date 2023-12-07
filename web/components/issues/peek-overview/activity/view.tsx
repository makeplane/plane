import { FC } from "react";
// components
import { IssueActivityCard, IssueCommentEditor } from "components/issues";
// types
import { IIssueActivity, IUser } from "types";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  user: IUser | null;
  issueActivity: IIssueActivity[] | null;
  issueCommentCreate: (comment: any) => void;
  issueCommentUpdate: (comment: any) => void;
  issueCommentRemove: (commentId: string) => void;
  issueCommentReactionCreate: (commentId: string, reaction: string) => void;
  issueCommentReactionRemove: (commentId: string, reaction: string) => void;
  showCommentAccessSpecifier: boolean;
};

export const IssueActivity: FC<Props> = (props) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    user,
    issueActivity,
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
        <IssueActivityCard
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          user={user}
          issueActivity={issueActivity}
          issueCommentUpdate={issueCommentUpdate}
          issueCommentRemove={issueCommentRemove}
          issueCommentReactionCreate={issueCommentReactionCreate}
          issueCommentReactionRemove={issueCommentReactionRemove}
        />
        <IssueCommentEditor onSubmit={handleAddComment} showAccessSpecifier={showCommentAccessSpecifier} />
      </div>
    </div>
  );
};
