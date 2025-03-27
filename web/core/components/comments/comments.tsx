"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TCommentsOperations, TIssueComment } from "@plane/types";
// local components
import { CommentCard } from "./comment-card";
import { CommentCreate } from "./comment-create";

type TCommentsWrapper = {
  projectId?: string;
  entityId: string;
  isEditingAllowed?: boolean;
  activityOperations: TCommentsOperations;
  comments: TIssueComment[] | string[];
  getCommentById?: (activityId: string) => TIssueComment | undefined;
};

export const CommentsWrapper: FC<TCommentsWrapper> = observer((props) => {
  const { entityId, activityOperations, comments, getCommentById, isEditingAllowed = true, projectId } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();

  return (
    <div className="relative flex flex-col gap-y-2 h-full overflow-hidden">
      {isEditingAllowed && (
        <CommentCreate
          workspaceSlug={workspaceSlug}
          entityId={entityId}
          activityOperations={activityOperations}
          projectId={projectId}
        />
      )}

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
              comment={comment as TIssueComment}
              activityOperations={activityOperations}
              disabled={!isEditingAllowed}
              ends={index === 0 ? "top" : index === comments.length - 1 ? "bottom" : undefined}
              projectId={projectId}
            />
          );
        })}
      </div>
    </div>
  );
});
