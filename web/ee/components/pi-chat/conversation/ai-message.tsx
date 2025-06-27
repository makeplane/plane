import { useState } from "react";
import { observer } from "mobx-react";
import Markdown from "react-markdown";
import { Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { Loader, PiChatLogo, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
import { cn, copyTextToClipboard } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EFeedback } from "@/plane-web/types";
import { FeedbackModal } from "../input/feedback-modal";
import { ReasoningBlock } from "./reasoning";
import { Thinking } from "./thinking";
import Link from "next/link";

type TProps = {
  id: string;
  message?: string;
  reasoning?: string;
  isPiThinking?: boolean;
  isLoading?: boolean;
  feedback?: EFeedback;
  isLatest?: boolean;
};
export const AiMessage = observer((props: TProps) => {
  // store
  const { message = "", reasoning, isPiThinking = false, id, isLoading = false, feedback, isLatest } = props;
  const { sendFeedback, activeChatId } = usePiChat();
  // state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const handleCopyLink = () => {
    copyTextToClipboard(message).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Response copied!",
        message: "Response to clipboard.",
      });
    });
  };
  const handleFeedback = async (feedback: EFeedback, feedbackMessage?: string) => {
    try {
      await sendFeedback(activeChatId, parseInt(id), feedback, feedbackMessage);
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

  const handleMessage = () => ((message.match(/```/g) || []).length % 2 !== 0 ? message + "```" : message);

  return (
    <div className="flex gap-4 mr-[50px]" id={id}>
      {/* Avatar */}
      <div className="bg-pi-700 rounded-full h-9 w-9 flex flex-shrink-0">
        <PiChatLogo className="size-6 text-white fill-current m-auto align-center" />
      </div>
      <div className="flex flex-col text-base break-words w-full">
        {/* Message */}
        {!isPiThinking && !isLoading && (
          <div className="flex flex-col gap-4">
            {reasoning && <ReasoningBlock reasoning={reasoning} isLatest={isLatest} />}
            <Markdown
              className="pi-chat-root [&>*:first-child]:mt-0"
              components={{
                a: ({ children, href }) => (
                  <a href={href || ""} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {handleMessage()}
            </Markdown>
          </div>
        )}

        {/* Typing */}
        {isPiThinking && <Thinking />}

        {isLoading && (
          <Loader>
            <Loader.Item width="50px" height="42px" />
          </Loader>
        )}
        {/* Action bar */}
        {!isPiThinking && !isLoading && (
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
        )}
      </div>
    </div>
  );
});
