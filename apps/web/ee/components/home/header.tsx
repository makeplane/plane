import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Maximize } from "lucide-react";
import { BetaBadge, Tooltip } from "@plane/ui";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { WithFeatureFlagHOC } from "../feature-flags";
import { InputBox } from "../pi-chat/input";

export const HomePageHeader = observer(() => {
  const { workspaceSlug } = useParams();
  const { activeChatId } = usePiChat();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  if (!isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED)) return <></>;
  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PI_CHAT" fallback={<></>}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold text-custom-text-350">Ask Pi</div>
            <BetaBadge />
          </div>
          <Tooltip tooltipContent="Maximize" position="top">
            <Link href={`/${workspaceSlug}/projects/pi-chat/${activeChatId || "new"}`}>
              <Maximize className="size-4 text-custom-text-350" />
            </Link>
          </Tooltip>
        </div>
        <InputBox isFullScreen isProjectLevel className="relative bg-transparent mt-2 max-w-[950px] mx-auto w-full" />
      </div>
    </WithFeatureFlagHOC>
  );
});
