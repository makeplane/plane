import { IWorkspaceCommentEnhancedSearchResult } from "@plane/constants";
import { Avatar } from "@plane/ui";
import { getFileURL, sanitizeHTML } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

export const CommentItem = ({ comment }: { comment: IWorkspaceCommentEnhancedSearchResult }) => {
  const { getUserDetails } = useMember();
  const userDetails = getUserDetails(comment.actor_id);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex gap-2 items-center truncate">
          <span className="text-custom-text-200 font-semibold">{userDetails?.display_name}</span>
          <span>commented on</span>
          <div className="flex gap-2 truncate">
            <IssueIdentifier
              projectIdentifier={comment.project_identifier}
              projectId={comment.project_id}
              issueTypeId={comment.issue_type_id}
              issueSequenceId={comment.issue_sequence_id}
              size="xs"
              textContainerClassName="text-xs"
            />
            <span className="text-custom-text-200 truncate">{comment.issue_name}</span>
          </div>
        </div>
      </div>
      <div className="text-custom-text-200 border-l border-custom-border-400 pl-2">{sanitizeHTML(comment.comment)}</div>
    </div>
  );
};

export const ActorAvatar = ({ actorId, size = "sm" }: { actorId: string; size?: "sm" | "md" | "lg" }) => {
  const { getUserDetails } = useMember();
  const userDetails = getUserDetails(actorId);
  return (
    <div className="pt-1">
      <Avatar
        src={userDetails?.avatar_url ? getFileURL(userDetails?.avatar_url) : ""}
        name={userDetails?.display_name}
        size={size}
      />
    </div>
  );
};
