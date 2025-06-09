import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { cn } from "@plane/utils";
import { useUser } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { NewConversation, Messages } from "./conversation";
import { Loading } from "./conversation/loading";
import { Header } from "./header";
import { History } from "./history";
import { InputBox } from "./input";

type TProps = {
  isFullScreen?: boolean;
  onlyShowInput?: boolean;
};
export const PiChatBase = observer((props: TProps) => {
  const { isFullScreen: isFullScreenProp = false, onlyShowInput = false } = props;
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // store hooks
  const {
    initPiChat,
    activeChatId,
    isPiThinking,
    isUserTyping,
    activeChat,
    fetchUserThreads,
    geUserThreads,
    fetchChatById,
    fetchModels,
    setActiveModel,
    getTemplates,
    isNewChat,
    isLoading,
    models,
    activeModel,
  } = usePiChat();
  const { isMobile } = usePlatformOS();
  const { data: currentUser } = useUser();
  // query params
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const chat_id = searchParams.get("chat_id");
  const [isInitialized, setIsInitialized] = useState(false);

  // derived states
  const userThreads = currentUser && geUserThreads(currentUser?.id);
  const isFullScreen = pathName.includes("pi-chat") || isFullScreenProp;

  useSWR(currentUser ? `PI_AI_MODELS` : null, currentUser ? () => fetchModels() : null, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    errorRetryCount: 0,
  });
  useSWR(
    currentUser ? `PI_USER_THREADS_${currentUser?.id}` : null,
    currentUser ? () => fetchUserThreads(currentUser?.id) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );
  useSWR(
    activeChatId ? `PI_ACTIVE_CHAT_${activeChatId}` : null,
    activeChatId ? () => fetchChatById(activeChatId) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );
  const { data: templates } = useSWR("PI_TEMPLATES", () => getTemplates(), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    errorRetryCount: 0,
  });

  // Handle initialization
  useEffect(() => {
    const initializeChat = async () => {
      await initPiChat(chat_id || undefined);
      setIsInitialized(true);
    };

    if (!isInitialized) {
      initializeChat();
    }
  }, [chat_id, isInitialized]);

  // Early return while initializing
  if (!isInitialized) {
    return <></>;
  }

  const toggleSidePanel = (value: boolean) => setIsSidePanelOpen(value);

  return onlyShowInput ? (
    <InputBox
      isFullScreen={isFullScreen}
      className="relative bg-transparent mt-2 max-w-[950px] mx-auto w-full"
      activeChatId={activeChatId}
      shouldRedirect
    />
  ) : (
    <div
      className={cn("md:flex h-full bg-pi-50", {
        "md:w-[450px] max-w-[450px] max-h-[722px] shadow-2xl rounded-md z-[20]": !isFullScreen,
      })}
    >
      <div className="flex flex-col flex-1 px-page-x pt-4 h-full">
        {/* Header */}
        <Header
          initPiChat={initPiChat}
          isSidePanelOpen={isSidePanelOpen}
          toggleSidePanel={toggleSidePanel}
          isFullScreen={isFullScreen}
          models={models}
          activeModel={activeModel}
          setActiveModel={setActiveModel}
          isNewChat={activeChat?.dialogue?.length === 0}
        />
        <div className="relative flex flex-col h-[90%] flex-1 align-middle justify-center max-w-[780px] md:m-auto w-full">
          <div className={cn("flex-1 my-auto flex flex-co h-full py-8")}>
            {/* Current conversation  */}
            {currentUser && activeChat?.dialogue?.length > 0 && !isLoading && (
              <Messages
                isPiThinking={isPiThinking}
                activeChat={activeChat}
                currentUser={currentUser}
                isUserTyping={isUserTyping}
                isFullScreen={isFullScreen}
                isLoading={isLoading}
              />
            )}

            {/* New conversation */}
            {isLoading && !isNewChat && currentUser ? (
              <Loading isLoading={isLoading} isFullScreen={isFullScreen} currentUser={currentUser} /> // loading
            ) : (
              activeChat?.dialogue?.length === 0 && (
                <NewConversation currentUser={currentUser} templates={templates} isFullScreen={isFullScreen} />
              )
            )}

            {/* Chat Input */}
            <InputBox
              isFullScreen={isFullScreen}
              activeChatId={activeChatId}
              className="flex flex-col absolute bottom-3 bg-pi-50 left-1/2 transform -translate-x-1/2 w-full px-2 md:px-0"
            />
          </div>
        </div>
      </div>
      {/* History */}
      {isFullScreen && (
        <History
          userThreads={userThreads}
          isSidePanelOpen={isSidePanelOpen}
          toggleSidePanel={toggleSidePanel}
          initPiChat={initPiChat}
          isMobile={isMobile}
          isNewChat={activeChat?.dialogue?.length === 0}
        />
      )}
    </div>
  );
});
