import { useCallback } from "react";

type CommentMarkInteractionHook = {
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleThreadClick: (e: React.MouseEvent) => void;
};

export function useCommentMarkInteraction(commentId: string): CommentMarkInteractionHook {
  const getCommentMark = useCallback(() => document.querySelector(`[data-comment-id="${commentId}"]`), [commentId]);

  const handleMouseEnter = useCallback(() => {
    const commentMark = getCommentMark();
    if (commentMark) {
      commentMark.classList.add("bg-[#FFBF66]/40", "transition-all", "duration-200");
    }
  }, [getCommentMark]);

  const handleMouseLeave = useCallback(() => {
    const commentMark = getCommentMark();
    if (commentMark) {
      commentMark.classList.remove("bg-[#FFBF66]/40", "transition-all", "duration-200");
    }
  }, [getCommentMark]);

  const handleThreadClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't trigger selection if clicking on interactive elements
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

      const commentMark = getCommentMark();
      if (commentMark) {
        // Add temporary highlight effect
        commentMark.classList.add("scale-[1.02]", "transition-all", "duration-300");

        // Scroll the comment mark into view in the editor
        commentMark.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Remove highlight effect after animation
        setTimeout(() => {
          commentMark.classList.remove("shadow-lg", "scale-[1.02]", "transition-all", "duration-300");
        }, 2000);
      }
    },
    [getCommentMark]
  );

  return {
    handleMouseEnter,
    handleMouseLeave,
    handleThreadClick,
  };
}
