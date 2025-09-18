import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
import { type JSONContent } from "@plane/types";
import { useNewComment } from "@/plane-web/hooks/pages/use-new-comment";
import { FileService } from "@/services/file.service";
import { type TPageInstance } from "@/store/pages/base-page";
import { PageCommentForm } from "./comment-form";

const fileService = new FileService();

const SCROLL_DELAY_SHORT = 50;
const SCROLL_DELAY_LONG = 250;
const SCROLL_OFFSET = -12;

type WorkspaceConfig = {
  workspaceSlug: string;
  workspaceId: string;
};

type PendingComment = {
  selection: { from: number; to: number };
  referenceText?: string;
};

type CommentHandlers = {
  onPendingCommentCancel?: () => void;
  onRegisterStartNewComment?: (
    handler: (selection?: { from: number; to: number; referenceText?: string }) => void
  ) => void;
  onCreateCommentMark?: (selection: { from: number; to: number }, commentId: string) => void;
  onScrollToElement: (
    element: HTMLElement,
    // eslint-disable-next-line
    options?: { behavior?: ScrollBehavior; block?: "start" | "center" | "end"; offset?: number }
  ) => void;
};

export type CommentComposerProps = {
  page: TPageInstance;
  workspaceConfig: WorkspaceConfig;
  pendingComment?: PendingComment;
  handlers: CommentHandlers;
};

export const PageCommentCreationHandler = observer(
  ({ page, workspaceConfig, pendingComment, handlers }: CommentComposerProps) => {
    const { workspaceSlug, workspaceId } = workspaceConfig;
    const { onPendingCommentCancel, onRegisterStartNewComment, onCreateCommentMark, onScrollToElement } = handlers;
    const newCommentBoxRef = useRef<HTMLDivElement>(null);

    const {
      showNewCommentBox,
      isSubmittingComment,
      newCommentSelection,
      handleAddComment,
      handleNewCommentCancel,
      handleStartNewComment,
    } = useNewComment({ page, onCreateCommentMark });

    // Register the start new comment handler
    useEffect(() => {
      if (onRegisterStartNewComment) {
        onRegisterStartNewComment(handleStartNewComment);
      }
    }, [handleStartNewComment, onRegisterStartNewComment]);

    // Auto-scroll to pending comment box
    useEffect(() => {
      if (pendingComment && newCommentBoxRef.current) {
        const scrollToNewComment = () => {
          if (newCommentBoxRef.current) {
            onScrollToElement(newCommentBoxRef.current, { block: "start", offset: SCROLL_OFFSET });
          }
        };

        const timeouts = [
          setTimeout(scrollToNewComment, SCROLL_DELAY_SHORT),
          setTimeout(scrollToNewComment, SCROLL_DELAY_LONG),
        ];
        return () => timeouts.forEach(clearTimeout);
      }
    }, [pendingComment, onScrollToElement]);

    const showCommentBox = showNewCommentBox || pendingComment;
    const referenceText = pendingComment?.referenceText || newCommentSelection?.referenceText;
    const commentSelection = pendingComment
      ? {
          from: pendingComment.selection.from,
          to: pendingComment.selection.to,
          referenceText: pendingComment.referenceText,
        }
      : newCommentSelection;

    const handleCancel = () => {
      handleNewCommentCancel({ pendingComment, onPendingCommentCancel });
    };

    const handleSubmit = async (data: {
      description: { description_html: string; description_json: JSONContent };
      uploadedAssetIds: string[];
    }) => {
      handleAddComment({ data, pendingComment, onPendingCommentCancel });

      // Update bulk asset status
      if (data.uploadedAssetIds.length > 0 && page.id) {
        if (page.project_ids?.length && page.project_ids?.length > 0) {
          await fileService.updateBulkProjectAssetsUploadStatus(workspaceSlug, page.project_ids[0], page.id, {
            asset_ids: data.uploadedAssetIds,
          });
        } else {
          await fileService.updateBulkWorkspaceAssetsUploadStatus(workspaceSlug, page.id, {
            asset_ids: data.uploadedAssetIds,
          });
        }
      }
    };

    if (!showCommentBox || !page.canCurrentUserCommentOnPage) {
      return null;
    }

    return (
      <div ref={newCommentBoxRef} className="overflow-hidden my-4 animate-expand-down space-y-3 group px-3.5">
        {/* Reference Text Quote with Overlay Cancel Button */}
        {referenceText && (
          <div className="relative flex gap-1 p-[4px] rounded bg-custom-background-90">
            <div className="w-0.5 self-stretch rounded-sm bg-[#FFBF66]" />
            <p className="flex-1 text-sm text-custom-text-300 leading-4 pr-6">{referenceText}</p>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmittingComment}
              className="absolute top-0.75 right-1 p-1 rounded transition-all duration-200 ease hover:bg-custom-background-80 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed z-10"
              aria-label="Cancel new comment"
            >
              <X className="size-3 text-custom-text-300" />
            </button>
          </div>
        )}

        {/* Cancel Button for when there's no reference text */}
        {!referenceText && (
          <div className="flex items-center justify-end pr-1 -mt-1">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmittingComment}
              className="p-1 rounded transition-all duration-200 ease hover:bg-custom-background-90 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Cancel new comment"
            >
              <X className="size-3.5 text-custom-text-300" />
            </button>
          </div>
        )}

        <PageCommentForm
          workspaceSlug={workspaceSlug}
          page={page}
          workspaceId={workspaceId}
          editable
          placeholder="Add a comment..."
          pageId={page.id}
          commentSelection={commentSelection}
          autoFocus
          isSubmitting={isSubmittingComment}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }
);
