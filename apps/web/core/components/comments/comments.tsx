import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import type { E_SORT_ORDER } from "@plane/constants";
import type { TCommentsOperations, TIssueComment } from "@plane/types";
// local components
import { CommentCard } from "./card/root";
import { CommentCreate } from "./comment-create";

type TCommentsWrapper = {
  projectId?: string;
  entityId: string;
  isEditingAllowed?: boolean;
  activityOperations: TCommentsOperations;
  comments: TIssueComment[] | string[];
  sortOrder?: E_SORT_ORDER;
  getCommentById?: (activityId: string) => TIssueComment | undefined;
  showAccessSpecifier?: boolean;
  showCopyLinkOption?: boolean;
  enableReplies?: boolean;
};

export const CommentsWrapper = observer(function CommentsWrapper(props: TCommentsWrapper) {
  const {
    entityId,
    activityOperations,
    comments,
    getCommentById,
    isEditingAllowed = true,
    projectId,
    showAccessSpecifier = false,
    showCopyLinkOption = false,
    enableReplies = false,
  } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const renderCommentCreate = useMemo(
    () =>
      isEditingAllowed && (
        <CommentCreate
          workspaceSlug={workspaceSlug}
          entityId={entityId}
          activityOperations={activityOperations}
          projectId={projectId}
        />
      ),
    [isEditingAllowed, workspaceSlug, entityId, activityOperations, projectId]
  );

  return (
    <div className="relative flex flex-col gap-y-2 h-full overflow-hidden">
      {renderCommentCreate}
      <div className="flex-grow py-4 overflow-y-auto">
        {comments?.map((data, index) => {
          let comment;
          if (typeof data === "string") {
            comment = getCommentById?.(data);
          } else {
            comment = data;
          }

          if (!comment) return null;
          return (
            <CommentCard
              key={comment.id}
              workspaceSlug={workspaceSlug}
              entityId={entityId}
              comment={comment}
              activityOperations={activityOperations}
              disabled={!isEditingAllowed}
              ends={index === 0 ? "top" : index === comments.length - 1 ? "bottom" : undefined}
              projectId={projectId}
              showAccessSpecifier={showAccessSpecifier}
              showCopyLinkOption={showCopyLinkOption}
              enableReplies={enableReplies}
            />
          );
        })}
      </div>
    </div>
  );
});
