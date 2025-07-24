import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { cn } from "@plane/utils";
import { useWorkspace } from "@/hooks/store";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { Header } from "./header";
import { RightSidePanel } from "./sidebar/right-side-panel";

type TProps = {
  isFullScreen?: boolean;
  children: React.ReactNode;
  isProjectLevel?: boolean;
  shouldRenderSidebarToggle?: boolean;
  isOpen?: boolean;
};

export const PiChatLayout = observer((props: TProps) => {
  const {
    isFullScreen: isFullScreenProp = false,
    children,
    isProjectLevel = false,
    shouldRenderSidebarToggle = false,
    isOpen = true,
  } = props;
  // states
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  // store hooks
  const { activeChatId, fetchUserThreads, fetchChatById, initPiChat } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  // query params
  const { workspaceSlug, chatId } = useParams();
  const pathName = usePathname();
  // derived states
  const isFullScreen = pathName.includes("pi-chat") || isFullScreenProp;

  useSWR(
    workspaceSlug ? `PI_USER_THREADS_${workspaceSlug}_${isProjectLevel}` : null,
    workspaceSlug
      ? () => fetchUserThreads(getWorkspaceBySlug(workspaceSlug as string)?.id || "", isProjectLevel)
      : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
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

  const toggleSidePanel = (value: boolean) => setIsSidePanelOpen(value);

  // Handle initialization
  useEffect(() => {
    if (!chatId) return;
    initPiChat(chatId as string);
  }, [chatId]);

  if (!isOpen) return <></>;
  return (
    <div className={cn("md:flex h-full rounded-lg bg-custom-background-100", {})}>
      <div className="flex flex-col flex-1 h-full">
        {/* Header */}
        <Header
          isSidePanelOpen={isSidePanelOpen}
          isProjectLevel={isProjectLevel}
          shouldRenderSidebarToggle={shouldRenderSidebarToggle}
          isFullScreen={isFullScreen}
          toggleSidePanel={toggleSidePanel}
        />
        {children}
      </div>
      {/* History */}
      {isFullScreen && isProjectLevel && (
        <RightSidePanel isSidePanelOpen={isSidePanelOpen} toggleSidePanel={toggleSidePanel} />
      )}
    </div>
  );
});
