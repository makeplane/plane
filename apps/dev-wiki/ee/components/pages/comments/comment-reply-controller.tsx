import { observer } from "mobx-react";
import { TCommentInstance } from "@/plane-web/store/pages/comments/comment-instance";
import { TPageInstance } from "@/store/pages/base-page";

type TCommentReplyController = {
  comment: TCommentInstance;
  handleShowRepliesToggle: (e: React.MouseEvent) => void;
  showReplies: boolean;
  page: TPageInstance;
};

export const PageCommentReplyController = observer(
  ({ comment, handleShowRepliesToggle, showReplies, page }: TCommentReplyController) => {
    // Use centralized thread display state for consistency
    const threadState = page.comments.getThreadDisplayState(comment.id, showReplies);

    if (!threadState || !threadState.shouldShowReplyController) return null;

    return (
      <div className="w-full animate-expand-action mb-4">
        <div className="w-full relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-custom-border-300 animate-scale-line" />
          <div className="relative flex justify-center">
            <button
              onClick={handleShowRepliesToggle}
              className="bg-custom-background-100 group-hover:bg-custom-background-90 px-3 py-1 text-custom-text-300 hover:text-custom-text-200 transition-colors animate-button-fade-up rounded text-xs font-medium"
            >
              {showReplies
                ? "Hide replies"
                : `Show ${threadState.hiddenRepliesCount} ${threadState.hiddenRepliesCount === 1 ? "reply" : "replies"}`}
            </button>
          </div>
        </div>
      </div>
    );
  }
);
