import { useParams } from "next/navigation";
import { WithFeatureFlagHOC } from "../feature-flags";
import { PiChatBase } from "./base";
import { EmptyPiChat } from "./empty";
export const PiChatRoot = () => {
  const { workspaceSlug } = useParams();
  return (
    // Add CE component for fallback
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PI_CHAT" fallback={<EmptyPiChat />}>
      <PiChatBase />
    </WithFeatureFlagHOC>
  );
};
