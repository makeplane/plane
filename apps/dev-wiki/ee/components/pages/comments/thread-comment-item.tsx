import React, { useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { JSONContent } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { useWorkspace } from "@/hooks/store/use-workspace";
// store types
import { useCommentMarkInteraction } from "@/plane-web/hooks/pages/use-comment-mark-interaction";
import { TCommentInstance } from "@/plane-web/store/pages/comments/comment-instance";
import { FileService } from "@/services/file.service";
import { TPageInstance } from "@/store/pages/base-page";
// local components
import { PageCommentDisplay } from "./comment-display";
import { PageCommentForm } from "./comment-form";
import { PageCommentReplyController } from "./comment-reply-controller";
import { PageCommentThreadReplyList } from "./thread-reply-list";

export type ThreadItemProps = {
  comment: TCommentInstance;
  page: TPageInstance;
  isSelected: boolean;
  referenceText?: string;
};

const fileService = new FileService();
export const PageThreadCommentItem = observer(
  React.forwardRef<HTMLDivElement, ThreadItemProps>(function ThreadItem({ comment, page, referenceText }, ref) {
    const { currentWorkspace } = useWorkspace();
    const { workspaceSlug } = useParams();
    const workspaceId = currentWorkspace?.id || "";
    // Local state for UI controls
    const [showReplies, setShowReplies] = useState(false);
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    // Action handlers
    const handleShowRepliesToggle = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setShowReplies((prev) => !prev);
      setShowReplyBox(false); // Close reply box when toggling replies
    }, []);

    const handleReplyToggle = useCallback(
      (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!page.canCurrentUserCommentOnPage) {
          console.warn("User does not have permission to comment");
          return;
        }
        setShowReplyBox((prev) => !prev);
        if (!showReplyBox) {
          setShowReplies(true); // Show replies when opening reply box
        }
      },
      [showReplyBox, page.canCurrentUserCommentOnPage]
    );

    const handleReply = useCallback(
      async (data: {
        description: { description_html: string; description_json: JSONContent };
        uploadedAssetIds: string[];
      }) => {
        if (!page.canCurrentUserCommentOnPage) {
          console.warn("User does not have permission to comment");
          return;
        }
        setIsSubmittingReply(true);
        try {
          await page.comments.createComment({
            description: {
              description_html: data.description.description_html,
              description_json: data.description.description_json,
            },
            parent_id: comment.id,
          });

          // Update bulk asset status
          if (data.uploadedAssetIds.length > 0 && page.id) {
            if (page.project_ids?.length && page.project_ids?.length > 0) {
              await fileService.updateBulkProjectAssetsUploadStatus(
                workspaceSlug.toString(),
                page.project_ids[0],
                page.id,
                {
                  asset_ids: data.uploadedAssetIds,
                }
              );
            } else {
              await fileService.updateBulkWorkspaceAssetsUploadStatus(workspaceSlug.toString(), page.id, {
                asset_ids: data.uploadedAssetIds,
              });
            }
          }

          // Close reply box and show replies
          setShowReplyBox(false);
          setShowReplies(true);
        } catch (error) {
          console.error("Failed to create reply:", error);
        } finally {
          setIsSubmittingReply(false);
        }
      },
      [comment.id, page, workspaceSlug]
    );
    const threadState = page.comments.getThreadDisplayState(comment.id, showReplies);

    // Use custom hook for comment mark interactions
    const { handleMouseEnter, handleMouseLeave, handleThreadClick } = useCommentMarkInteraction({
      commentId: comment.id,
      editorRef: page.editor.editorRef,
    });

    return (
      <div
        ref={ref}
        data-thread-id={comment.id}
        key={comment.id}
        className={cn(
          `relative w-full py-3 px-3.5 flex-col flex gap-3 cursor-pointer transition-all duration-200 bg-custom-background-100 hover:bg-custom-background-90 group animate-comment-item`
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleThreadClick}
      >
        {/* Reference Text Quote */}
        {referenceText && (
          <div className="flex gap-1 p-[4px] rounded bg-custom-background-90">
            <div className="w-0.5 self-stretch rounded-sm bg-[#FFBF66]" />
            <p className="flex-1 text-sm text-custom-text-300 leading-4">{referenceText}</p>
          </div>
        )}

        <div className="relative">
          {/* We only show the connector if there are only 2 comments or if there's a single comment but replybox is open */}
          {((!threadState?.shouldShowReplyController && comment.total_replies) ||
            (comment.total_replies === 0 && showReplyBox)) && (
            <div className="absolute left-3 top-0 -bottom-4 w-0.5 bg-custom-border-300" aria-hidden />
          )}
          {/* Main Thread Comment */}
          <PageCommentDisplay comment={comment} page={page} isParent />
        </div>

        <div className="flex flex-col gap-0">
          <PageCommentReplyController
            comment={comment}
            handleShowRepliesToggle={handleShowRepliesToggle}
            showReplies={showReplies}
            page={page}
          />

          {/* Replies List */}
          <PageCommentThreadReplyList
            page={page}
            threadId={comment.id}
            showReplies={showReplies}
            showReplyBox={showReplyBox}
          />

          {/* Action Bar */}
          {page.canCurrentUserCommentOnPage && !showReplyBox && (
            <div className="flex items-center justify-end h-8">
              <button
                type="button"
                onClick={handleReplyToggle}
                className="h-6 rounded transition-colors hover:bg-custom-background-90"
              >
                <span className="text-xs font-medium text-custom-primary-100 transition-colors hover:text-custom-primary-200">
                  Reply
                </span>
              </button>
            </div>
          )}
        </div>
        {/* Reply Box */}
        {showReplyBox && page.canCurrentUserCommentOnPage && (
          <div className="overflow-hidden animate-expand-reply space-y-3">
            <PageCommentForm
              workspaceSlug={workspaceSlug?.toString() || ""}
              workspaceId={workspaceId}
              editable
              placeholder="Reply to comment"
              isReply
              autoFocus
              isSubmitting={isSubmittingReply}
              onSubmit={handleReply}
              onCancel={handleReplyToggle}
              page={page}
            />
          </div>
        )}
      </div>
    );
  })
);
