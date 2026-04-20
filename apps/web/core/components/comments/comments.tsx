/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

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
  activityOperations: TCommentsOperations;
  comments: TIssueComment[] | string[];
  sortOrder?: E_SORT_ORDER;
  getCommentById?: (activityId: string) => TIssueComment | undefined;
  showAccessSpecifier?: boolean;
  showCopyLinkOption?: boolean;
  enableReplies?: boolean;
  permissions: {
    canCreate: boolean;
    canEdit: (commentId: string) => boolean;
    canDelete: (commentId: string) => boolean;
    canReact: (commentId: string) => boolean;
  };
};

export const CommentsWrapper = observer(function CommentsWrapper(props: TCommentsWrapper) {
  const {
    entityId,
    activityOperations,
    comments,
    getCommentById,
    projectId,
    showAccessSpecifier = false,
    showCopyLinkOption = false,
    enableReplies = false,
    permissions,
  } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // derived values
  const { canCreate, canEdit, canDelete, canReact } = permissions;
  const renderCommentCreate = useMemo(
    () =>
      canCreate && (
        <CommentCreate
          workspaceSlug={workspaceSlug}
          entityId={entityId}
          activityOperations={activityOperations}
          projectId={projectId}
        />
      ),
    [canCreate, workspaceSlug, entityId, activityOperations, projectId]
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
              permissions={{
                canEdit: canEdit(comment.id),
                canDelete: canDelete(comment.id),
                canReact: canReact(comment.id),
              }}
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
