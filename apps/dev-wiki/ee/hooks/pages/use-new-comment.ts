import { useCallback, useState } from "react";
import { type JSONContent } from "@plane/types";
import { TPageInstance } from "@/store/pages/base-page";

type NewCommentSelection = {
  from: number;
  to: number;
  referenceText?: string;
};

type UseNewCommentProps = {
  page: TPageInstance;
  onCreateCommentMark?: (selection: { from: number; to: number }, commentId: string) => void;
};

export const useNewComment = ({ page, onCreateCommentMark }: UseNewCommentProps) => {
  const [showNewCommentBox, setShowNewCommentBox] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [newCommentSelection, setNewCommentSelection] = useState<NewCommentSelection | null>(null);

  const getCurrentSelection = (pendingComment?: { selection: { from: number; to: number }; referenceText?: string }) =>
    pendingComment
      ? {
          from: pendingComment.selection.from,
          to: pendingComment.selection.to,
          referenceText: pendingComment.referenceText,
        }
      : newCommentSelection;

  const createNewComment = async (
    data: { description: { description_html: string; description_json: JSONContent } },
    selection: NewCommentSelection | null
  ) =>
    await page.comments.createComment({
      description: {
        description_html: data.description.description_html,
        description_json: data.description.description_json,
        description_stripped: selection?.referenceText || undefined,
      },
      reference_stripped: selection?.referenceText || undefined,
    });

  const handleCommentMarkCreation = (selection: NewCommentSelection, commentId: string) => {
    if (onCreateCommentMark) {
      onCreateCommentMark(
        {
          from: selection.from,
          to: selection.to,
        },
        commentId
      );
      page.comments.setPendingScrollToComment(commentId);
    }
  };

  const resetCommentState = (
    pendingComment?: {
      selection: { from: number; to: number };
      referenceText?: string;
    },
    onPendingCommentCancel?: () => void
  ) => {
    setShowNewCommentBox(false);
    setNewCommentSelection(null);

    if (pendingComment && onPendingCommentCancel) {
      onPendingCommentCancel();
    }
  };

  const handleAddComment = async (params: {
    data: { description: { description_html: string; description_json: JSONContent } };
    pendingComment?: {
      selection: { from: number; to: number };
      referenceText?: string;
    };
    onPendingCommentCancel?: () => void;
  }) => {
    const { data, pendingComment, onPendingCommentCancel } = params;
    setIsSubmittingComment(true);
    try {
      if (!page.id) throw new Error("Missing required data");
      if (!page.canCurrentUserCommentOnPage) throw new Error("User does not have permission to comment");

      const currentSelection = getCurrentSelection(pendingComment);
      const newComment = await createNewComment(data, currentSelection);

      if (currentSelection) {
        handleCommentMarkCreation(currentSelection, newComment.id);
      }
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmittingComment(false);
      resetCommentState(pendingComment, onPendingCommentCancel);
    }
  };

  const handleNewCommentCancel = (params: {
    pendingComment?: {
      selection: { from: number; to: number };
      referenceText?: string;
    };
    onPendingCommentCancel?: () => void;
  }) => {
    const { pendingComment, onPendingCommentCancel } = params;
    resetCommentState(pendingComment, onPendingCommentCancel);
  };

  const handleStartNewComment = useCallback(
    (selection?: { from: number; to: number; referenceText?: string }) => {
      if (!page.canCurrentUserCommentOnPage) {
        console.warn("User does not have permission to comment");
        return;
      }
      setShowNewCommentBox(true);
      if (selection) {
        setNewCommentSelection(selection);
      }
    },
    [page.canCurrentUserCommentOnPage]
  );

  return {
    showNewCommentBox,
    isSubmittingComment,
    newCommentSelection,
    handleAddComment,
    handleNewCommentCancel,
    handleStartNewComment,
  };
};
