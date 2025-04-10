"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { E_SORT_ORDER } from "@plane/constants";
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
  sortOrder?: E_SORT_ORDER;
  getCommentById?: (activityId: string) => TIssueComment | undefined;
};

export const CommentsWrapper: FC<TCommentsWrapper> = observer((props) => {
  const {
    entityId,
    activityOperations,
    comments,
    getCommentById,
    isEditingAllowed = true,
    projectId,
    sortOrder,
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
          callBack={async (elementId: string) => {
            const sourceElementId = elementId ?? "";
            const sourceElement = document.getElementById(sourceElementId);
            if (sourceElement)
              await smoothScrollIntoView(sourceElement, { behavior: "smooth", block: "center", duration: 1500 });
          }}
        />
      ),
    [isEditingAllowed, workspaceSlug, entityId, activityOperations, projectId]
  );

  return (
    <div className="relative flex flex-col gap-y-2 h-full overflow-hidden">
      {sortOrder === E_SORT_ORDER.DESC && renderCommentCreate}
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
      {sortOrder === E_SORT_ORDER.ASC && renderCommentCreate}
    </div>
  );
});
