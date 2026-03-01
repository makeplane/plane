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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { SendHorizonal } from "lucide-react";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Input } from "@plane/ui";
import { cn } from "@plane/utils";
import { useProjectUpdates } from "@/plane-web/hooks/store/projects/use-project-updates";
import type { TProjectUpdatesComment } from "@/types";
import { CommentBlock } from "./comment-block";

type TProps = {
  isCollapsed: boolean;
  updateId: string;
  workspaceSlug: string;
  projectId: string;
};
export type TActivityOperations = {
  create: (e: React.FormEvent) => Promise<TProjectUpdatesComment | undefined>;
  update: (commentId: string, data: Partial<TProjectUpdatesComment | undefined>) => Promise<void>;
  remove: (commentId: string) => Promise<void>;
};

export const CommentList = observer(function CommentList(props: TProps) {
  const { isCollapsed, updateId, workspaceSlug, projectId } = props;
  const [newComment, setNewComment] = useState("");

  const {
    comments: { fetchComments, createComment, updateComment, removeComment, getCommentsByUpdateId, getCommentById },
  } = useProjectUpdates();

  useSWR(
    workspaceSlug && projectId && updateId ? `PROJECT_UPDATES_COMMENTS_${projectId}_${updateId}` : null,
    workspaceSlug && projectId && updateId ? () => fetchComments(workspaceSlug, projectId, updateId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const updateCommentOperations: TActivityOperations = useMemo(
    () => ({
      create: async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          if (!workspaceSlug || !projectId || !updateId) throw new Error("Missing fields");
          const comment = await createComment(workspaceSlug, projectId, updateId, {
            description: newComment,
          });
          setNewComment("");
          return comment;
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment creation failed. Please try again later.",
          });
        }
      },
      update: async (commentId, data) => {
        try {
          if (!workspaceSlug || !projectId || data === undefined) throw new Error("Missing fields");
          await updateComment(workspaceSlug, projectId, commentId, data);
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment update failed. Please try again later.",
          });
        }
      },
      remove: async (commentId) => {
        try {
          if (!workspaceSlug || !projectId || !updateId) throw new Error("Missing fields");
          await removeComment(workspaceSlug, projectId, updateId, commentId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment removed successfully.",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment remove failed. Please try again later.",
          });
        }
      },
    }),
    [workspaceSlug, projectId, updateId, newComment, createComment, updateComment, removeComment]
  );

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
                    commentData={commentData}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    operations={updateCommentOperations}
                  />
                )
              );
            })}
        </div>
        <form
          onSubmit={updateCommentOperations.create}
          className="flex items-center gap-1 px-2 mb-2 w-full rounded-md shadow border border-subtle"
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
            disabled={newComment.trim() === ""}
            className={`flex items-center justify-center size-6 text-13 rounded-full flex-shrink-0 ${
              newComment.trim() === ""
                ? "bg-layer-1 text-tertiary cursor-not-allowed"
                : "bg-accent-primary text-on-color hover:bg-accent-primary/90"
            }`}
          >
            <SendHorizonal className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
});
