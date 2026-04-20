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

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { SendHorizonal } from "lucide-react";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { EUpdateEntityType, TUpdateComment, TUpdateOperations } from "@plane/types";
import { Input } from "@plane/ui";
import { cn } from "@plane/utils";
import { useUpdateDetail } from "@/plane-web/hooks/use-update-detail";
import { CommentBlock } from "./comment-block";

type TProps = {
  isCollapsed: boolean;
  updateId: string;
  workspaceSlug: string;
  entityId: string;
  entityType: EUpdateEntityType;
  handleUpdateOperations: TUpdateOperations;
  permissions: {
    canCreate: boolean;
    canUpdate: (commentId: string) => boolean;
    canDelete: (commentId: string) => boolean;
    canReact: (commentId: string) => boolean;
  };
};

export type TActivityOperations = {
  create: (e: React.FormEvent) => Promise<TUpdateComment | undefined>;
  update: (commentId: string, data: Partial<TUpdateComment | undefined>) => Promise<void>;
  remove: (commentId: string) => Promise<void>;
};

export const CommentList = observer(function CommentList(props: TProps) {
  const { isCollapsed, updateId, workspaceSlug, entityId, entityType, handleUpdateOperations, permissions } = props;
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    comments: { getCommentsByUpdateId, getCommentById },
  } = useUpdateDetail(entityType);
  const { fetchComments, createComment } = handleUpdateOperations;

  useSWR(
    workspaceSlug && entityId && updateId ? `${entityType}_COMMENTS_${entityId}_${updateId}` : null,
    workspaceSlug && entityId && updateId ? () => fetchComments(updateId, "fetch") : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!workspaceSlug || !entityId || !updateId) throw new Error("Missing fields");
      const comment = await createComment(updateId, {
        description: newComment,
      });
      setNewComment("");
      setToast({
        title: "Success!",
        type: TOAST_TYPE.SUCCESS,
        message: "Comment created successfully.",
      });
      setIsSubmitting(false);
      return comment;
    } catch (error) {
      setToast({
        title: "Error!",
        type: TOAST_TYPE.ERROR,
        message: "Comment creation failed. Please try again later.",
      });
      setIsSubmitting(false);
    }
  };

  const comments = getCommentsByUpdateId(updateId);

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out ",
        !isCollapsed ? "max-h-[800px] border-t border-subtle" : "max-h-0"
      )}
    >
      <div className="mt-4">
        <div className="max-h-[300px] overflow-scroll pb-2">
          {comments &&
            comments.map((item, id) => {
              const commentData = getCommentById(item);
              return (
                commentData && (
                  <CommentBlock
                    key={id}
                    updateId={updateId}
                    commentData={commentData}
                    workspaceSlug={workspaceSlug}
                    entityId={entityId}
                    operations={handleUpdateOperations}
                    entityType={entityType}
                    permissions={{
                      canEdit: permissions.canUpdate(item),
                      canDelete: permissions.canDelete(item),
                      canReact: permissions.canReact(item),
                    }}
                  />
                )
              );
            })}
        </div>
        {permissions.canCreate && (
          <form
            onSubmit={handleCreateComment}
            className="flex items-center gap-1 px-2 mb-4 w-full rounded-md shadow border border-subtle"
          >
            <Input
              placeholder="Write your comment"
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
              }}
              className="px-1.5 border-none flex-grow"
            />
            <button
              type="submit"
              disabled={newComment.trim() === "" || isSubmitting}
              className={`flex items-center justify-center size-6 text-13 rounded-full flex-shrink-0 ${
                newComment.trim() === ""
                  ? "bg-layer-1 text-tertiary cursor-not-allowed"
                  : "bg-accent-primary text-on-color hover:bg-accent-primary/90"
              }`}
            >
              <SendHorizonal className="size-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
});
