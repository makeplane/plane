import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
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
  setHasMoreMessages: (value: boolean) => void;
};

export const Messages = observer((props: TProps) => {
  const {
    currentUser,
    isLoading,
    isFullScreen,
    shouldRedirect = true,
    isProjectLevel = false,
    setHasMoreMessages,
  } = props;
  const { isPiThinking, activeChat } = usePiChat();
  const containerRef = useRef(null);

  const checkIfHasMore = () => {
    const el: HTMLElement | null = containerRef.current;
    if (!el || activeChat?.dialogue?.length === 0) return;

    const isOverflowing = (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight;
    const isNotAtBottom =
      (el as HTMLElement).scrollTop + (el as HTMLElement).clientHeight < (el as HTMLElement).scrollHeight - 1;

    setHasMoreMessages(isOverflowing && isNotAtBottom);
  };
  useEffect(() => {
    const el: HTMLElement | null = containerRef.current;
    if (!el) return;

    checkIfHasMore();

    (el as HTMLElement).addEventListener("scroll", checkIfHasMore);
    window.addEventListener("resize", checkIfHasMore);

    return () => {
      (el as HTMLElement).removeEventListener("scroll", checkIfHasMore);
      window.removeEventListener("resize", checkIfHasMore);
    };
  }, []);

  useEffect(() => {
    //Always scroll to the latest message
    if (!activeChat?.dialogue) return;
    if (activeChat?.dialogue.length === 0) setHasMoreMessages(false);
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
    <div
      ref={containerRef}
      className={cn("flex flex-col gap-8 max-h-full h-full w-full mx-auto overflow-y-scroll pt-8 pb-[230px]")}
    >
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
      {/* observer element */}
      <div id="observer-element" />
    </div>
  );
});
