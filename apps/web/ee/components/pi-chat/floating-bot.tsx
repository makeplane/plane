import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@plane/utils";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { WithFeatureFlagHOC } from "../feature-flags";
import { PiChatDetail } from "./detail";
import { PiChatLayout } from "./layout";

export const PiChatFloatingBot = observer(() => {
  // states
  const { isPiChatDrawerOpen: isOpen, togglePiChatDrawer, initPiChat } = usePiChat();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // query params
  const pathName = usePathname();
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  // derived states
  const isSidePanelOpen = searchParams.get("pi_sidebar_open");
  const chatId = searchParams.get("chat_id");
  const isPiEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED);

  useEffect(() => {
    if (!isPiEnabled) return;
    // initialize chat
    if (chatId) initPiChat(chatId.toString());
    else initPiChat();
    // open side panel
    if (isSidePanelOpen) {
      togglePiChatDrawer(true);
    }
  }, [isPiEnabled]);

  if (pathName.includes("pi-chat")) return null;
  if (!isPiEnabled) return <></>;

  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PI_CHAT" fallback={<></>}>
      <div
        className={cn(
          "transform transition-all duration-300 ease-in-out overflow-x-hidden",
          "rounded-lg border border-custom-border-200 h-full max-w-[400px]",
          isOpen ? "translate-x-0 w-[400px] mr-2" : "px-0 translate-x-[100%] w-0 border-none"
        )}
      >
        <PiChatLayout isFullScreen={false} isProjectLevel isOpen={isOpen}>
          <PiChatDetail isFullScreen={false} shouldRedirect={false} isProjectLevel />
        </PiChatLayout>
      </div>
    </WithFeatureFlagHOC>
  );
});
