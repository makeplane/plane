import { useParams } from "next/navigation";
import { WorkspaceHomeView } from "@/components/home";
import { WorkspaceDashboardView } from "@/components/page-views";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";

export const HomeBase = () => {
  const { workspaceSlug } = useParams();
  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag="HOME_ADVANCED"
      fallback={<WorkspaceDashboardView />}
    >
      <WorkspaceHomeView />
    </WithFeatureFlagHOC>
  );
};
