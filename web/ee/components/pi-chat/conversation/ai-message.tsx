import Image from "next/image";
import { Copy, ThumbsUp, ThumbsDown, Repeat2 } from "lucide-react";
import { cn } from "@plane/editor";
import { Loader, PiChatLogo, setToast, TOAST_TYPE } from "@plane/ui";
import { copyTextToClipboard } from "@/helpers/string.helper";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EFeedback } from "@/plane-web/types";
// import PiChatLogo from "@/public/logos/pi.png";
import Typing from "./typing";
type TProps = {
  id: string;
  message?: string;
  isPiTyping?: boolean;
  isLoading?: boolean;
};
export const AiMessage = (props: TProps) => {
  const { message = "", isPiTyping = false, id, isLoading = false } = props;
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
      await sendFeedback(feedback);
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
    <div className="flex gap-4" id={id}>
      {/* Avatar */}
      <div className="bg-gradient-to-br from-pi-100 to-pi-200 rounded-full h-9 w-9 flex">
        <PiChatLogo className="size-6 text-pi-700 fill-current m-auto align-center" />
      </div>
      <div className="flex flex-col w-fit">
        {/* Message */}
        {!isPiTyping && !isLoading && <div className={cn("text-base", {})}>{message}</div>}

        {/* Typing */}
        {isPiTyping && (
          <div className="flex">
            <span className="text-base">is thinking &nbsp;</span>
            <Typing />
          </div>
        )}

        {isLoading && (
          <Loader>
            <Loader.Item width="50px" height="42px" />
          </Loader>
        )}
        {/* Action bar */}
        {!isPiTyping && !isLoading && (
          <div className="flex gap-4 mt-6">
            <Copy size={16} onClick={handleCopyLink} className="my-auto cursor-pointer text-pi-700" />
            <ThumbsUp
              size={16}
              onClick={() => handleFeedback(EFeedback.POSITIVE)}
              className="my-auto cursor-pointer text-pi-700"
            />
            <ThumbsDown
              size={16}
              onClick={() => handleFeedback(EFeedback.NEGATIVE)}
              className="my-auto cursor-pointer text-pi-700"
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
};
