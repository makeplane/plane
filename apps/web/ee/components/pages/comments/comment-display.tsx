import React, { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Check, CircleCheck, Edit, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
// plane imports
import type { JSONContent } from "@plane/types";
import { AlertModalCore, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
// store types
import { type TCommentInstance } from "@/plane-web/store/pages/comments/comment-instance";
import { type TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageCommentForm } from "./comment-form";
import { PageCommentUserInfo } from "./comment-user-info";

type CommentItemProps = {
  comment: TCommentInstance;
  page: TPageInstance;
  isSelected?: boolean;
  isParent: boolean;
  className?: string;
};

export const PageCommentDisplay = observer(
  ({ comment, page, isSelected: _isSelected = false, isParent, className = "" }: CommentItemProps) => {
    // Local state for UI controls (optimized to only essential states)
    const [isEditing, setIsEditing] = useState(false);
    const [deleteCommentModal, setDeleteCommentModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get workspace details for editor
    const { currentWorkspace } = useWorkspace();
    const { uploadEditorAsset } = useEditorAsset();
    const workspaceSlug = currentWorkspace?.slug || "";
    const workspaceId = currentWorkspace?.id || "";

    const showResolveButton = isParent;

    const handleEdit = useCallback(
      async (data: { description: { description_html: string; description_json: JSONContent } }) => {
        if (!comment.id) return;

        await page.comments.updateComment(comment.id, {
          description: {
            description_html: data.description.description_html,
            description_json: data.description.description_json,
          },
        });

        // Success - show toast and exit editing mode
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Comment updated successfully.",
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
          title: "Edit comment",
          icon: Edit,
          shouldRender: !isEditing,
        },
        {
          key: "resolve",
          action: () => handleResolve({ stopPropagation: () => {} } as React.MouseEvent),
          title: comment.is_resolved ? "Unresolve comment" : "Resolve comment",
          icon: comment.is_resolved ? RotateCcw : Check,
          shouldRender: showResolveButton,
          className: comment.is_resolved ? "" : "text-green-600",
        },
        {
          key: "delete",
          action: () => setDeleteCommentModal(true),
          title: "Delete comment",
          icon: Trash2,
          shouldRender: true,
          className: "text-red-500",
        },
      ],
      [comment.is_resolved, handleResolve, isEditing, showResolveButton]
    );

    return (
      <div className={cn(`group flex flex-col justify-center items-start gap-1 w-full`, className)}>
        {/* Comment Header */}
        <div className="flex items-center gap-1 pr-1 relative w-full">
          <PageCommentUserInfo userId={comment.created_by} size="sm" timestamp={comment.created_at} />

          {/* Action Buttons */}
          <div className="absolute right-1 top-0 flex items-center gap-1 p-1 bg-custom-background-100 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {showResolveButton &&
              (comment.is_resolved ? (
                <button
                  onClick={handleResolve}
                  className="p-1 rounded transition-all duration-200 ease active:scale-95"
                  aria-label="Unresolve comment"
                >
                  <CircleCheck className="size-4 text-green-600" />
                </button>
              ) : (
                <button
                  onClick={handleResolve}
                  className="p-1 rounded transition-all duration-200 ease hover:bg-custom-background-90 hover:scale-105 active:scale-95"
                  aria-label="Resolve comment"
                >
                  <CircleCheck className="size-4 text-custom-text-300 transition-colors duration-200 ease" />
                </button>
              ))}

            <CustomMenu
              customButton={
                <button
                  className="p-1 rounded transition-all duration-200 ease hover:bg-custom-background-90 hover:scale-105 active:scale-95"
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-3.5 h-3.5 text-custom-text-300 transition-colors duration-200 ease" />
                </button>
              }
              placement="bottom-end"
              closeOnSelect
              portalElement={document.body}
              optionsClassName="z-[60]"
            >
              {menuItems.map((item) => {
                if (item.shouldRender === false) return null;
                return (
                  <CustomMenu.MenuItem
                    key={item.key}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      item.action?.();
                    }}
                    className={cn(`flex items-center gap-2`, item.className)}
                  >
                    {item.icon && <item.icon className="size-3.5" />}
                    {item.title}
                  </CustomMenu.MenuItem>
                );
              })}
            </CustomMenu>
          </div>
        </div>

        {/* Comment Content */}
        <PageCommentForm
          page={page}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          comment={comment}
          editable={isEditing}
          placeholder="Edit comment..."
          autoFocus={isEditing}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
          uploadEditorAsset={uploadEditorAsset}
        />

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
  }
);
