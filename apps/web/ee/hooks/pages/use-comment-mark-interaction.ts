import { useCallback, useEffect, useRef } from "react";
import type { EditorRefApi } from "@plane/editor";

type CommentMarkInteractionHook = {
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleThreadClick: (e: React.MouseEvent) => void;
};

type UseCommentMarkInteractionParams = {
  commentId: string;
  editorRef?: EditorRefApi | null;
};

export function useCommentMarkInteraction({
  commentId,
  editorRef,
}: UseCommentMarkInteractionParams): CommentMarkInteractionHook {
  const deselectTimeoutRef = useRef<number | null>(null);

  const clearHover = useCallback(() => {
    editorRef?.hoverCommentMarks([]);
  }, [editorRef]);

  const clearSelection = useCallback(() => {
    editorRef?.selectCommentMark(null);
  }, [editorRef]);

  const handleMouseEnter = useCallback(() => {
    editorRef?.hoverCommentMarks([commentId]);
  }, [editorRef, commentId]);

  const handleMouseLeave = useCallback(() => {
    clearHover();
  }, [clearHover]);

  const handleThreadClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.closest("button") ||
        target.tagName === "INPUT" ||
        target.closest("input") ||
        target.tagName === "A" ||
        target.closest("a")
      ) {
        return;
      }

      editorRef?.selectCommentMark(commentId);
      editorRef?.scrollToCommentMark(commentId);

      if (deselectTimeoutRef.current) {
        window.clearTimeout(deselectTimeoutRef.current);
      }

      deselectTimeoutRef.current = window.setTimeout(() => {
        editorRef?.selectCommentMark(null);
        deselectTimeoutRef.current = null;
      }, 2000);
    },
    [editorRef, commentId]
  );

  useEffect(
    () => () => {
      if (deselectTimeoutRef.current) {
        window.clearTimeout(deselectTimeoutRef.current);
      }
      clearHover();
      clearSelection();
    },
    [clearHover, clearSelection]
  );

  return {
    handleMouseEnter,
    handleMouseLeave,
    handleThreadClick,
  };
}
