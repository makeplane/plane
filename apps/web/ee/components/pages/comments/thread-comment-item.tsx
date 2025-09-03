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

export const PageThreadCommentItem = observer(
  React.forwardRef<HTMLDivElement, ThreadItemProps>(function ThreadItem(
    { comment, page, isSelected, referenceText },
    ref
  ) {
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
      async (data: { description: { description_html: string; description_json: JSONContent } }) => {
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

          // Close reply box and show replies
          setShowReplyBox(false);
          setShowReplies(true);
        } catch (error) {
          console.error("Failed to create reply:", error);
        } finally {
          setIsSubmittingReply(false);
        }
      },
      [comment.id, page.comments, page.canCurrentUserCommentOnPage]
    );

    // Use custom hook for comment mark interactions
    const { handleMouseEnter, handleMouseLeave, handleThreadClick } = useCommentMarkInteraction(comment.id);

    return (
      <div
        ref={ref}
        data-thread-id={comment.id}
        key={comment.id}
        className={cn(
          `relative w-full p-1.5 flex-col flex gap-1 border-b border-custom-border-200 cursor-pointer transition-all duration-200 bg-custom-background-100 hover:bg-custom-background-90 group`,
          {
            "bg-custom-background-90": isSelected,
          }
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleThreadClick}
      >
        {/* Reference Text Quote */}
        {referenceText && (
          <div className="flex gap-1 p-1 rounded bg-custom-background-90">
            <div className="w-0.5 self-stretch rounded-sm bg-[#FFBF66]" />
            <p className="flex-1 text-xs text-custom-text-300 leading-4">{referenceText}</p>
          </div>
        )}

        {/* Main Thread Comment */}
        <div className="overflow-hidden space-y-3">
          <PageCommentDisplay comment={comment} page={page} isSelected={isSelected} isParent />
        </div>

        <div className="flex flex-col gap-0">
          <PageCommentReplyController
            comment={comment}
            handleShowRepliesToggle={handleShowRepliesToggle}
            showReplies={showReplies}
          />

          {/* Replies List */}
          <PageCommentThreadReplyList page={page} threadId={comment.id} showReplies={showReplies} />

          {/* Action Bar */}
          {page.canCurrentUserCommentOnPage && (
            <div className="flex items-center h-8">
              <button
                onClick={handleReplyToggle}
                className="h-6 rounded transition-all duration-200 ease hover:bg-custom-background-90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="text-xs font-medium text-custom-primary-100 transition-colors duration-200 ease hover:text-custom-primary-200">
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
              placeholder="Reply to comment..."
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
