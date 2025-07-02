import { useParams } from "next/navigation";
import { WithFeatureFlagHOC } from "../feature-flags";
import { PiChatBase } from "../pi-chat/base";

export const HomePageHeader = () => {
  const { workspaceSlug } = useParams();

  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PI_CHAT" fallback={<></>}>
      <PiChatBase isFullScreen onlyShowInput />
    </WithFeatureFlagHOC>
  );
};
