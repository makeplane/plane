import { useState } from "react";
import { Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EFeedback } from "@/plane-web/types";
import { FeedbackModal } from "../input/feedback-modal";

export type TProps = {
  answer: string;
  activeChatId: string;
  id: string;
  workspaceId: string | undefined;
  feedback: EFeedback | undefined;
};

export const Feedback = (props: TProps) => {
  // props
  const { answer, activeChatId, id, workspaceId, feedback } = props;
  // states
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  // store
  const { sendFeedback } = usePiChat();
  // handlers
  const handleCopyLink = () => {
    copyTextToClipboard(answer).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Response copied!",
        message: "Response to clipboard.",
      });
    });
  };
  const handleFeedback = async (feedback: EFeedback, feedbackMessage?: string) => {
    try {
      await sendFeedback(activeChatId, parseInt(id), feedback, workspaceId, feedbackMessage);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Feedback sent!",
        message: "Feedback sent!",
      });
    } catch (e) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Feedback failed!",
        message: "Feedback failed!",
      });
    }
  };

  return (
    <div className="flex gap-4 mt-6">
      {/* Copy */}
      <Tooltip tooltipContent="Copy to clipboard" position="bottom" className="mb-4">
        <Copy size={16} onClick={handleCopyLink} className="my-auto cursor-pointer text-pi-700" />
      </Tooltip>

      {/* Good response */}
      {(!feedback || feedback === EFeedback.POSITIVE) && (
        <Tooltip tooltipContent="Good response" position="bottom" className="mb-4">
          <button
            className={cn({
              "cursor-default": feedback === EFeedback.POSITIVE,
            })}
            onClick={() => !feedback && handleFeedback(EFeedback.POSITIVE)}
          >
            <ThumbsUp
              size={16}
              fill={feedback === EFeedback.POSITIVE ? "currentColor" : "none"}
              className="my-auto text-pi-700 transition-colors	"
            />
          </button>
        </Tooltip>
      )}

      {/* Bad response */}
      {(!feedback || feedback === EFeedback.NEGATIVE) && (
        <Tooltip tooltipContent="Bad response" position="bottom" className="mb-4">
          <button
            className={cn({
              "!cursor-default": feedback === EFeedback.NEGATIVE,
            })}
            onClick={() => !feedback && setIsFeedbackModalOpen(true)}
          >
            <ThumbsDown
              size={16}
              fill={feedback === EFeedback.NEGATIVE ? "currentColor" : "none"}
              className="my-auto text-pi-700 transition-colors	"
            />
          </button>
        </Tooltip>
      )}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={(feedbackMessage) => handleFeedback(EFeedback.NEGATIVE, feedbackMessage)}
      />

      {/* Rewrite will be available in the future */}
      {/* <div className="flex text-sm font-medium gap-1 cursor-pointer">
            <Repeat2 size={20} onClick={() => console.log()} className="my-auto cursor-pointer" /> Rewrite
          </div> */}
    </div>
  );
};
