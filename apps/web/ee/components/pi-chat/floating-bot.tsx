import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { WithFeatureFlagHOC } from "../feature-flags";
import { PiChatDetail } from "./detail";
import { PiChatLayout } from "./layout";

export const PiChatFloatingBot = observer(() => {
  // states
  const { isPiChatDrawerOpen: isOpen } = usePiChat();

  // query params
  const pathName = usePathname();
  const { workspaceSlug } = useParams();

  if (pathName.includes("pi-chat")) return null;

  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PI_CHAT" fallback={<></>}>
      <div
        className={cn(
          "transform transition-all duration-300 ease-in-out overflow-x-hidden",
          "rounded-lg border border-custom-border-200 h-full max-w-[400px]",
          isOpen ? "translate-x-0 w-[400px]" : "px-0 translate-x-[100%] w-0 border-none"
        )}
      >
        <PiChatLayout isFullScreen={false} isProjectLevel isOpen={isOpen}>
          <PiChatDetail isFullScreen={false} shouldRedirect={false} isProjectLevel />
        </PiChatLayout>
      </div>
    </WithFeatureFlagHOC>
  );
});
