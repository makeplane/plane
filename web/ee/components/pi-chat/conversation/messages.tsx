import { useEffect } from "react";
import { observer } from "mobx-react";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { cn } from "@plane/editor";
import { TChatHistory } from "@/plane-web/types";
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
  const { isPiTyping, activeChat, currentUser, isUserTyping, isFullScreen, isLoading } = props;

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
  }, [activeChat]);

  return (
    <div
      className={cn("flex flex-col gap-8 max-h-full h-full overflow-y-scroll w-[90%] mx-auto pb-[230px]", {
        "md:w-[70%]": isFullScreen,
      })}
    >
      {activeChat?.dialogue.map((message: string, index: number) => (
        <div key={index}>
          {index % 2 === 0 ? (
            <MyMessage message={message} currentUser={currentUser} id={index.toString()} />
          ) : (
            <AiMessage message={message} id={index.toString()} />
          )}
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
