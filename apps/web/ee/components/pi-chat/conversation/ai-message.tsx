import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, ThumbsDown, ThumbsUp } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { Loader, PiIcon, setToast, TOAST_TYPE } from "@plane/ui";
import { cn, copyTextToClipboard } from "@plane/utils";
// plane-web imports
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EFeedback } from "@/plane-web/types";
// local imports
import { FeedbackModal } from "../input/feedback-modal";
import { ReasoningBlock } from "./reasoning";

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
  const { message = "", reasoning, isPiThinking = false, id, isLoading = false, feedback, isLatest } = props;
  // store
  const { workspaceSlug } = useParams();
  const { sendFeedback, activeChatId } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug as string)?.id;
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
    <div className="flex gap-4 mr-[50px]" id={id}>
      {/* Avatar */}
      <div className="rounded-full flex flex-shrink-0 my-1">
        <PiIcon className="size-5 text-custom-text-primary fill-current align-center" />
      </div>
      <div className="flex flex-col text-base break-words w-full">
        {/* Message */}
        <div className="flex flex-col gap-4">
          {!isLoading && <ReasoningBlock reasoning={reasoning} showLoading={isPiThinking && isLatest} />}
          <Markdown
            remarkPlugins={[remarkGfm]}
            className="pi-chat-root [&>*:first-child]:mt-0"
            components={{
              a: ({ children, href }) => (
                <a href={href || ""} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto w-full my-4 border-custom-border-200">
                  <table className="min-w-full border-collapse">{children}</table>
                </div>
              ),
              th: ({ children }) => <th className="px-2 py-3 border-custom-border-200">{children}</th>,
              td: ({ children }) => <td className="px-2 py-3 border-custom-border-200">{children}</td>,
            }}
          >
            {message}
          </Markdown>
        </div>
        {isLoading && (
          <Loader>
            <Loader.Item width="50px" height="42px" />
          </Loader>
        )}
        {/* Action bar */}
        {message && (
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
