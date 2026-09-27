/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import type { TPageComment, TPageCommentPayload } from "@plane/types";
import { Button, Avatar } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn, sanitizeRichHTML } from "@plane/utils";
import { LiteTextEditor } from "@/components/editor/lite-text";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";
import { PageCommentStore } from "@/store/pages/page-comment.store";

type TPageCommentsProps = {
  pageId: string;
  isEditingAllowed?: boolean;
};

export const PageComments = observer(function PageComments(props: TPageCommentsProps) {
  const { pageId, isEditingAllowed = true } = props;
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString() || "";

  const [commentStore] = useState(() => new PageCommentStore());
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  const workspaceStore = useWorkspace();
  const { data: currentUser } = useUser();
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug)?.id as string;

  useEffect(() => {
    if (workspaceSlug && pageId) {
      commentStore.fetchComments(workspaceSlug, pageId);
    }
  }, [workspaceSlug, pageId, commentStore]);

  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<Partial<TPageCommentPayload>>({
    defaultValues: { comment_html: "<p></p>" },
  });

  const onSubmit = useCallback(
    async (formData: Partial<TPageCommentPayload>) => {
      if (!workspaceSlug || !pageId) return;
      try {
        const payload: TPageCommentPayload = {
          comment_html: formData.comment_html || "<p></p>",
          parent: replyToCommentId || undefined,
        };
        await commentStore.createComment(workspaceSlug, pageId, payload);
        reset({ comment_html: "<p></p>" });
        editorRef.current?.clearEditor();
        setReplyToCommentId(null);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Comment added",
          message: "Your comment has been posted.",
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Failed to post comment.",
        });
      }
    },
    [workspaceSlug, pageId, replyToCommentId, commentStore, reset]
  );

  const handleEdit = useCallback(
    async (commentId: string, commentHtml: string) => {
      if (!workspaceSlug || !pageId) return;
      try {
        await commentStore.updateComment(workspaceSlug, pageId, commentId, {
          comment_html: commentHtml,
        });
        setEditingCommentId(null);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Comment updated",
          message: "Your comment has been updated.",
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Failed to update comment.",
        });
      }
    },
    [workspaceSlug, pageId, commentStore]
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!workspaceSlug || !pageId) return;
      try {
        await commentStore.removeComment(workspaceSlug, pageId, commentId);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Comment deleted",
          message: "The comment has been removed.",
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Failed to delete comment.",
        });
      }
    },
    [workspaceSlug, pageId, commentStore]
  );

  const commentHTML = watch("comment_html");
  const isEmpty = !commentHTML || commentHTML === "<p></p>" || commentHTML.trim() === "";

  // Separate top-level comments and replies
  const topLevelComments = commentStore.comments.filter((c) => !c.parent);
  const getReplies = (parentId: string) => commentStore.comments.filter((c) => c.parent === parentId);

  const renderComment = (comment: TPageComment, depth: number = 0) => {
    const isAuthor = comment.actor === currentUser?.id;
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={cn("flex flex-col gap-2", depth > 0 && "ml-8")}>
        <div className="flex gap-3 rounded-lg border border-subtle p-3">
          <Avatar name={comment.actor_detail?.display_name} src={comment.actor_detail?.avatar_url} size="sm" />
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{comment.actor_detail?.display_name}</span>
              <span className="text-xs text-tertiary">{new Date(comment.created_at).toLocaleDateString()}</span>
              {comment.edited_at && <span className="text-xs text-tertiary">(edited)</span>}
            </div>
            {editingCommentId === comment.id ? (
              <EditCommentForm
                initialHtml={comment.comment_html}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                pageId={pageId}
                onSubmit={(html) => handleEdit(comment.id, html)}
                onCancel={() => setEditingCommentId(null)}
              />
            ) : (
              <div
                className="prose-sm text-sm"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHTML(comment.comment_html) }}
              />
            )}
            {isEditingAllowed && depth === 0 && (
              <div className="text-xs flex gap-2">
                <button
                  onClick={() => setReplyToCommentId(replyToCommentId === comment.id ? null : comment.id)}
                  className="text-primary hover:underline"
                >
                  Reply
                </button>
                {isAuthor && (
                  <>
                    <button onClick={() => setEditingCommentId(comment.id)} className="text-primary hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(comment.id)} className="text-red-500 hover:underline">
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {replies.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium">Comments</h3>

      {/* Comment list */}
      <div className="flex flex-col gap-3">
        {commentStore.loader && <p className="text-xs text-tertiary">Loading comments...</p>}
        {!commentStore.loader && topLevelComments.length === 0 && (
          <p className="text-xs text-tertiary">No comments yet. Be the first to comment.</p>
        )}
        {topLevelComments.map((comment) => renderComment(comment))}
      </div>

      {/* Reply indicator */}
      {replyToCommentId && (
        <div className="text-xs flex items-center gap-2 text-tertiary">
          <span>Replying to comment</span>
          <button onClick={() => setReplyToCommentId(null)} className="text-primary hover:underline">
            Cancel
          </button>
        </div>
      )}

      {/* Comment create */}
      {isEditingAllowed && (
        <div
          role="form"
          aria-label="Add a comment"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isEmpty && !isSubmitting) {
              handleSubmit(onSubmit)(e);
            }
          }}
        >
          <Controller
            name="comment_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <LiteTextEditor
                editable
                workspaceId={workspaceId}
                id={`add_comment_${pageId}`}
                value="<p></p>"
                workspaceSlug={workspaceSlug}
                onEnterKeyPress={(e) => {
                  if (!isEmpty && !isSubmitting) handleSubmit(onSubmit)(e);
                }}
                ref={editorRef}
                initialValue={value ?? "<p></p>"}
                containerClassName="min-h-min"
                onChange={(_commentJson, commentHtml) => onChange(commentHtml)}
                isSubmitting={isSubmitting}
                uploadFile={async () => ""}
                duplicateFile={async () => ""}
                parentClassName="p-2"
                displayConfig={{ fontSize: "small-font" }}
              />
            )}
          />
          <div className="mt-2 flex justify-end">
            <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isEmpty || isSubmitting}>
              Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

// Edit comment form component
type TEditCommentFormProps = {
  initialHtml: string;
  workspaceId: string;
  workspaceSlug: string;
  pageId: string;
  onSubmit: (html: string) => void;
  onCancel: () => void;
};

function EditCommentForm(props: TEditCommentFormProps) {
  const { initialHtml, workspaceId, workspaceSlug, pageId, onSubmit, onCancel } = props;
  const [html, setHtml] = useState(initialHtml);
  const editorRef = useRef<any>(null);

  return (
    <div className="flex flex-col gap-2">
      <LiteTextEditor
        editable
        workspaceId={workspaceId}
        id={`edit_comment_${pageId}`}
        value="<p></p>"
        workspaceSlug={workspaceSlug}
        ref={editorRef}
        initialValue={initialHtml}
        containerClassName="min-h-min"
        onChange={(_json, commentHtml) => setHtml(commentHtml)}
        uploadFile={async () => ""}
        duplicateFile={async () => ""}
        parentClassName="p-2"
        displayConfig={{ fontSize: "small-font" }}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline-primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => onSubmit(html)}>
          Save
        </Button>
      </div>
    </div>
  );
}
