import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { cn } from "@plane/utils";
import { NotAuthorizedView } from "@/components/auth-screens";
import { useUser, useWorkspace } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { Messages } from "./conversation";
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
  // states
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // store hooks
  const {
    activeChatId,
    isAuthorized,
    isNewChat,
    isLoading,
    fetchUserThreads,
    fetchChatById,
    fetchModels,
    getTemplates,
    initPiChat,
  } = usePiChat();
  const { isMobile } = usePlatformOS();
  const { data: currentUser } = useUser();
  const { getWorkspaceBySlug } = useWorkspace();
  // query params
  const { workspaceSlug } = useParams();
  const router = useAppRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();

  // derived states
  const chat_id = searchParams.get("chat_id");
  const isFullScreen = pathName.includes("pi-chat") || isFullScreenProp;

  useSWR(currentUser ? `PI_AI_MODELS` : null, currentUser ? () => fetchModels() : null, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    errorRetryCount: 0,
  });
  useSWR(
    currentUser && workspaceSlug ? `PI_USER_THREADS_${currentUser?.id}_${workspaceSlug}` : null,
    currentUser && workspaceSlug
      ? () => fetchUserThreads(currentUser?.id, getWorkspaceBySlug(workspaceSlug as string)?.id || "")
      : null,
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
      await initPiChat(onlyShowInput ? undefined : chat_id || activeChatId || undefined);
      setIsInitialized(true);
    };

    if (!isInitialized) {
      initializeChat();
    }
    // In caase we are on pi-chat page and we have an activeChatId, we need to redirect to the chat page
    if (!chat_id && !onlyShowInput && isFullScreen && activeChatId) {
      router.push(`${pathName}?chat_id=${activeChatId}`);
    }
  }, [chat_id, isInitialized]);

  // Early return while initializing
  if (!isInitialized || !currentUser) {
    return <></>;
  }

  const toggleSidePanel = (value: boolean) => setIsSidePanelOpen(value);

  if (onlyShowInput) {
    return (
      <InputBox
        isFullScreen={isFullScreen}
        className="relative bg-transparent mt-2 max-w-[950px] mx-auto w-full"
        activeChatId={activeChatId}
        shouldRedirect
      />
    );
  }
  return (
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
          isNewChat={isNewChat && isAuthorized}
        />
        {isAuthorized ? (
          <div className="relative flex flex-col h-[90%] flex-1 align-middle justify-center max-w-[780px] md:m-auto w-full">
            <div className={cn("flex-1 my-auto flex flex-co h-full py-8")}>
              {isLoading ? (
                <Loading isLoading={isLoading} isFullScreen={isFullScreen} currentUser={currentUser} /> // loading
              ) : (
                <Messages
                  currentUser={currentUser}
                  isLoading={isLoading}
                  templates={templates}
                  isFullScreen={isFullScreen}
                />
              )}

              {/* Chat Input */}
              <InputBox
                isFullScreen={isFullScreen}
                activeChatId={activeChatId}
                className="flex flex-col absolute bottom-3 bg-pi-50 left-1/2 transform -translate-x-1/2 w-full px-2 md:px-0"
              />
            </div>
          </div>
        ) : (
          <NotAuthorizedView className="bg-transparent" />
        )}
      </div>
      {/* History */}
      {isFullScreen && (
        <History
          currentUser={currentUser}
          isSidePanelOpen={isSidePanelOpen}
          toggleSidePanel={toggleSidePanel}
          initPiChat={initPiChat}
          isMobile={isMobile}
          isNewChat={isNewChat && isAuthorized}
          activeChatId={activeChatId}
        />
      )}
    </div>
  );
});
