import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@plane/editor";
import { Loader, PiChatLogo, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
import { copyTextToClipboard } from "@/helpers/string.helper";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EFeedback } from "@/plane-web/types";
import { Thinking } from "./thinking";
const Markdown = dynamic(() => import("markdown-to-jsx"), {
  loading: () => <Thinking />,
});

type TProps = {
  id: string;
  message?: string;
  isPiTyping?: boolean;
  isLoading?: boolean;
  feedback?: EFeedback;
};
export const AiMessage = observer((props: TProps) => {
  const { message = "", isPiTyping = false, id, isLoading = false, feedback } = props;
  const { sendFeedback } = usePiChat();

  const handleCopyLink = () => {
    copyTextToClipboard(message).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Response copied!",
        message: "Response to clipboard.",
      });
    });
  };
  const handleFeedback = async (feedback: EFeedback) => {
    try {
      await sendFeedback(parseInt(id), feedback);
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
      <div className="bg-pi-700 rounded-full h-9 w-9 flex">
        <PiChatLogo className="size-6 text-white fill-current m-auto align-center" />
      </div>
      <div className="flex flex-col w-fit text-base break-words">
        {/* Message */}
        {!isPiTyping && !isLoading && <Markdown className="pi-chat-root">{message}</Markdown>}

        {/* Typing */}
        {isPiTyping && <Thinking />}

        {isLoading && (
          <Loader>
            <Loader.Item width="50px" height="42px" />
          </Loader>
        )}
        {/* Action bar */}
        {!isPiTyping && !isLoading && (
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
                  onClick={() => !feedback && handleFeedback(EFeedback.NEGATIVE)}
                >
                  <ThumbsDown
                    size={16}
                    fill={feedback === EFeedback.NEGATIVE ? "currentColor" : "none"}
                    className="my-auto text-pi-700 transition-colors	"
                  />
                </button>
              </Tooltip>
            )}

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
