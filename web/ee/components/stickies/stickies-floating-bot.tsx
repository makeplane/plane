import { useParams } from "next/navigation";
import { StickyActionBar } from "@/components/stickies";
import { WithFeatureFlagHOC } from "../feature-flags";

export const StickiesFloatingBot = () => {
  const { workspaceSlug } = useParams();
  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="STICKIES" fallback={<></>}>
      <StickyActionBar />
    </WithFeatureFlagHOC>
  );
};
