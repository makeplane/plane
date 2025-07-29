import { useEffect } from "react";
import { observer } from "mobx-react";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { IUser } from "@plane/types";
import { cn } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { TDialogue } from "@/plane-web/types";
import { AiMessage } from "./ai-message";
import { MyMessage } from "./my-message";
import { NewConversation } from "./new-converstaion";

type TProps = {
  isLoading: boolean;
  currentUser: IUser | undefined;
  isFullScreen: boolean;
  shouldRedirect?: boolean;
  isProjectLevel?: boolean;
};

export const Messages = observer((props: TProps) => {
  const { currentUser, isLoading, isFullScreen, shouldRedirect = true, isProjectLevel = false } = props;
  const { isPiThinking, activeChat } = usePiChat();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat?.dialogue?.length]);

  if (!activeChat?.dialogue || activeChat?.dialogue.length === 0)
    return (
      <NewConversation
        currentUser={currentUser}
        isFullScreen={isFullScreen}
        shouldRedirect={shouldRedirect}
        isProjectLevel={isProjectLevel}
      />
    );

  return (
    <div className={cn("flex flex-col gap-8 max-h-full h-full w-full mx-auto overflow-scroll pt-8 pb-[230px]")}>
      {activeChat?.dialogue?.map((message: TDialogue, index: number) => (
        <div key={index} className="space-y-4">
          <MyMessage message={message.query} currentUser={currentUser} id={index.toString()} />
          {(message.answer || message.reasoning) && (
            <AiMessage
              message={message.answer}
              reasoning={message.reasoning}
              id={index.toString()}
              feedback={message.feedback}
              isLatest={index === activeChat?.dialogue.length - 1}
            />
          )}
        </div>
      ))}
      {/* Typing */}
      {isPiThinking && <AiMessage isPiThinking={isPiThinking} id={""} />}

      {/* Loading */}
      {isLoading && <AiMessage isLoading={isLoading} id={""} />}
      {isLoading && <MyMessage isLoading={isLoading} currentUser={currentUser} id={""} />}
    </div>
  );
});
