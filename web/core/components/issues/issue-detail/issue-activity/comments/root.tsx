import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { SimpleEmptyState } from "@/components/empty-state";
// hooks
import { useIssueDetail } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// local components
import { TActivityOperations } from "../root";
import { IssueCommentCard } from "./comment-card";

type TIssueCommentRoot = {
  projectId: string;
  workspaceSlug: string;
  issueId: string;
  activityOperations: TActivityOperations;
  showAccessSpecifier?: boolean;
  disabled?: boolean;
};

export const IssueCommentRoot: FC<TIssueCommentRoot> = observer((props) => {
  const { workspaceSlug, projectId, issueId, activityOperations, showAccessSpecifier, disabled } = props;
  // hooks
  const {
    comment: { getCommentsByIssueId },
  } = useIssueDetail();
  const { t } = useTranslation();
  // derived values
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/comments" });

  const commentIds = getCommentsByIssueId(issueId);
  if (!commentIds) return <></>;

  return (
    <div>
      {commentIds.length > 0 ? (
        commentIds.map((commentId, index) => (
          <IssueCommentCard
            projectId={projectId}
            issueId={issueId}
            key={commentId}
            workspaceSlug={workspaceSlug}
            commentId={commentId}
            ends={index === 0 ? "top" : index === commentIds.length - 1 ? "bottom" : undefined}
            activityOperations={activityOperations}
            showAccessSpecifier={showAccessSpecifier}
            disabled={disabled}
          />
        ))
      ) : (
        <div className="flex items-center justify-center py-9">
          <SimpleEmptyState
            title={t("issue_comment.empty_state.general.title")}
            description={t("issue_comment.empty_state.general.description")}
            assetPath={resolvedPath}
          />
        </div>
      )}
    </div>
  );
});
