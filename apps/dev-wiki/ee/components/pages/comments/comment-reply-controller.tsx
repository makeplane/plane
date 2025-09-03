import { observer } from "mobx-react";
import { TCommentInstance } from "@/plane-web/store/pages/comments/comment-instance";

type TCommentReplyController = {
  comment: TCommentInstance;
  handleShowRepliesToggle: (e: React.MouseEvent) => void;
  showReplies: boolean;
};

export const PageCommentReplyController = observer(
  ({ comment, handleShowRepliesToggle, showReplies }: TCommentReplyController) => (
    <>
      {comment.hasReplies && comment.total_replies && (
        <div className="w-full animate-expand-action">
          <div className="w-full relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-custom-border-200 animate-scale-line" />
            <div className="relative flex justify-center">
              <button
                onClick={handleShowRepliesToggle}
                className="bg-custom-background-100 group-hover:bg-custom-background-90 px-3 py-1 text-custom-text-300 hover:text-custom-text-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] animate-button-fade-up rounded text-xs font-medium"
              >
                {showReplies
                  ? "Hide replies"
                  : `Show ${comment.total_replies} ${comment.total_replies === 1 ? "reply" : "replies"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
);
