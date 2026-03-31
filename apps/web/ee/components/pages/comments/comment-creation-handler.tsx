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

import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { CloseIcon } from "@plane/propel/icons";
import type { JSONContent } from "@plane/types";
import { useNewComment } from "@/plane-web/hooks/pages/use-new-comment";
import { FileService } from "@/services/file.service";
import type { TPageInstance } from "@/store/pages/base-page";
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

    options?: { behavior?: ScrollBehavior; block?: "start" | "center" | "end"; offset?: number }
  ) => void;
};

export type CommentComposerProps = {
  page: TPageInstance;
  workspaceConfig: WorkspaceConfig;
  pendingComment?: PendingComment;
  handlers: CommentHandlers;
};

export const PageCommentCreationHandler = observer(function PageCommentCreationHandler({
  page,
  workspaceConfig,
  pendingComment,
  handlers,
}: CommentComposerProps) {
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
    <div ref={newCommentBoxRef} className="my-4 animate-expand-down space-y-3 group px-3.5">
      {/* Reference Text Quote with Overlay Cancel Button */}
      {referenceText && (
        <div className="relative flex min-w-0 gap-1 overflow-hidden rounded bg-surface-2 p-[4px]">
          <div className="w-0.5 self-stretch rounded-sm bg-[#FFBF66]" />
          <p className="min-w-0 flex-1 break-words whitespace-pre-wrap pr-6 text-13 leading-4 text-tertiary">
            {referenceText}
          </p>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmittingComment}
            className="absolute top-0.75 right-1 p-1 rounded transition-all duration-200 ease hover:bg-layer-1 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed z-10"
            aria-label="Cancel new comment"
          >
            <CloseIcon className="size-3 text-tertiary" />
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
            className="p-1 rounded transition-all duration-200 ease hover:bg-surface-2 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Cancel new comment"
          >
            <CloseIcon className="size-3.5 text-tertiary" />
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
});
