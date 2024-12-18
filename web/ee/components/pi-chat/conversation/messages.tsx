import { useEffect } from "react";
import { observer } from "mobx-react";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { cn } from "@plane/utils";
import { TChatHistory, TDialogue } from "@/plane-web/types";
import { AiMessage } from "./ai-message";
import { MyMessage } from "./my-message";

type TProps = {
  isPiTyping: boolean;
  isUserTyping: boolean;
  activeChat: TChatHistory | undefined;
  isFullScreen: boolean;
  isLoading: boolean;
  currentUser: {
    display_name: string;
    avatar: string;
  };
};

export const Messages = observer((props: TProps) => {
  const { isPiTyping, activeChat, currentUser, isUserTyping, isLoading } = props;

  const scrollIntoViewHelper = async (elementId: string) => {
    const sourceElementId = elementId ?? "";
    const sourceElement = document.getElementById(sourceElementId);
    if (sourceElement)
      await smoothScrollIntoView(sourceElement, { behavior: "smooth", block: "center", duration: 1500 });
  };

  useEffect(() => {
    //Always scroll to the latest message
    if (!activeChat?.dialogue) return;
    scrollIntoViewHelper((activeChat?.dialogue.length - 1).toString());
  }, [activeChat?.dialogue?.length]);

  return (
    <div className={cn("flex flex-col gap-8 max-h-full h-full overflow-y-scroll w-full mx-auto pb-[230px]")}>
      {activeChat?.dialogue.map((message: TDialogue, index: number) => (
        <div key={index} className="space-y-4">
          <MyMessage message={message.query} currentUser={currentUser} id={index.toString()} />
          {message.answer && <AiMessage message={message.answer} id={index.toString()} feedback={message.feedback} />}
        </div>
      ))}

      {/* Typing */}
      {isPiTyping && <AiMessage isPiTyping={isPiTyping} id={""} />}
      {isUserTyping && <MyMessage isUserTyping={isUserTyping} currentUser={currentUser} id={""} />}

      {/* Loading */}
      {isLoading && <AiMessage isLoading={isLoading} id={""} />}
      {isLoading && <MyMessage isLoading={isLoading} currentUser={currentUser} id={""} />}
    </div>
  );
});
