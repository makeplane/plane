import React, { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { CircleCheck, Pencil, Trash2 } from "lucide-react";
// plane imports
import type { JSONContent } from "@plane/types";
import { AlertModalCore, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";
// store types
import { type TCommentInstance } from "@/plane-web/store/pages/comments/comment-instance";
import { type TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageCommentAvatar } from "./comment-avatar";
import { PageCommentForm } from "./comment-form";
import { PageCommentUserDetails } from "./comment-user-details";

type CommentItemProps = {
  comment: TCommentInstance;
  page: TPageInstance;
  isParent: boolean;
  className?: string;
};

export const PageCommentDisplay = observer(({ comment, page, isParent, className = "" }: CommentItemProps) => {
  // Local state for UI controls (optimized to only essential states)
  const [isEditing, setIsEditing] = useState(false);
  const [deleteCommentModal, setDeleteCommentModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get workspace details for editor
  const { data: currentUser } = useUser();
  const { currentWorkspace } = useWorkspace();
  const workspaceSlug = currentWorkspace?.slug || "";
  const workspaceId = currentWorkspace?.id || "";

  const commentAuthorId = comment.created_by || comment.actor;
  const pageOwnerId = page.owned_by;
  const canEditComment = !!commentAuthorId && commentAuthorId === currentUser?.id;
  const canDeleteComment = canEditComment || (!!pageOwnerId && pageOwnerId === currentUser?.id);
  const showResolveButton = isParent && page.canCurrentUserCommentOnPage;

  const handleEdit = useCallback(
    async (data: { description: { description_html: string; description_json: JSONContent } }) => {
      if (!comment.id) return;

      page.comments.updateComment(comment.id, {
        description: {
          description_html: data.description.description_html,
          description_json: data.description.description_json,
        },
      });

      setIsEditing(false);
    },
    [comment.id, page.comments]
  );

  const handleClose = () => {
    setIsDeleting(false);
    setDeleteCommentModal(false);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!comment.id) return;

    setIsDeleting(true);
    try {
      await page.comments.deleteComment(comment.id);
      // Also remove the corresponding comment mark from the editor
      page.editor.editorRef?.removeComment(comment.id);
      handleClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Comment deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Comment could not be deleted. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [comment.id, page.comments, page.editor.editorRef]);

  const handleResolve = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!comment.id) return;
      try {
        if (comment.is_resolved) {
          await page.comments.unresolveComment(comment.id);

          if (page.editor.editorRef) {
            page.editor.editorRef.unresolveCommentMark(comment.id);
          }
        } else {
          await page.comments.resolveComment(comment.id);
          if (page.editor.editorRef) {
            page.editor.editorRef.resolveCommentMark(comment.id);
          }
        }
      } catch (error) {
        console.error("Failed to resolve/unresolve comment:", error);
      }
    },
    [comment.id, comment.is_resolved, page.comments, page.editor.editorRef]
  );

  // Define menu items following the actions.tsx pattern
  const menuItems: (TContextMenuItem & { key: string })[] = useMemo(
    () => [
      {
        key: "edit",
        action: () => setIsEditing(true),
        title: "Edit",
        icon: Pencil,
        shouldRender: canEditComment && !isEditing,
      },
      {
        key: "delete",
        action: () => setDeleteCommentModal(true),
        title: "Delete",
        icon: Trash2,
        shouldRender: canDeleteComment,
      },
    ],
    [canDeleteComment, canEditComment, isEditing]
  );

  const hasMenuItems = useMemo(() => menuItems.some((item) => item.shouldRender !== false), [menuItems]);

  return (
    <div className={cn(`group flex gap-2 min-w-0`, className)}>
      {/* Left Column - Avatar */}
      <PageCommentAvatar userId={comment.created_by} size="sm" />

      {/* Right Column - Details + Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Header Row - Name/Timestamp + Actions */}
        <div className="flex items-baseline justify-between pr-1">
          <PageCommentUserDetails userId={comment.created_by} timestamp={comment.created_at} />

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {showResolveButton && (
              <Tooltip
                tooltipContent={comment.is_resolved ? "Mark as unresolved" : "Mark as resolved"}
                position="bottom"
                className="text-xs"
              >
                <div
                  onClick={handleResolve}
                  className="size-5 flex items-center justify-center rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors cursor-pointer"
                >
                  <CircleCheck
                    className={cn(
                      "size-4 p-[1.5px]",
                      comment.is_resolved
                        ? "size-5 fill-custom-text-300 text-custom-background-100 hover:text-custom-background-90"
                        : "text-custom-text-300"
                    )}
                  />
                </div>
              </Tooltip>
            )}

            {hasMenuItems && (
              <div className="size-5 flex items-center justify-center rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors">
                <CustomMenu
                  placement="bottom-end"
                  closeOnSelect
                  ellipsis
                  portalElement={document.body}
                  optionsClassName="z-[60]"
                >
                  {menuItems.map((item) => {
                    if (item.shouldRender === false) return null;
                    return (
                      <CustomMenu.MenuItem
                        key={item.key}
                        onClick={() => {
                          item.action?.();
                        }}
                        className={cn(`flex items-center gap-2`, item.className)}
                      >
                        {item.icon && <item.icon className="size-3" />}
                        {item.title}
                      </CustomMenu.MenuItem>
                    );
                  })}
                </CustomMenu>
              </div>
            )}
          </div>
        </div>

        {/* Comment Content */}
        <PageCommentForm
          page={page}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          comment={comment}
          editable={isEditing}
          placeholder="Edit comment"
          autoFocus={isEditing}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>

      {/* Delete Comment Modal */}
      <AlertModalCore
        handleClose={handleClose}
        handleSubmit={handleDeleteConfirm}
        isSubmitting={isDeleting}
        isOpen={deleteCommentModal}
        title="Delete comment"
        content={<>Are you sure you want to delete this comment? This action cannot be undone.</>}
      />
    </div>
  );
});
