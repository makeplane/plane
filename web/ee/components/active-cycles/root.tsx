import { useParams } from "next/navigation";
// plane web components
import { WorkspaceActiveCyclesList, WorkspaceActiveCyclesUpgrade } from "@/plane-web/components/active-cycles";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";

export const WorkspaceActiveCyclesRoot = () => {
  // router
  const { workspaceSlug } = useParams();

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag="WORKSPACE_ACTIVE_CYCLES"
      fallback={<WorkspaceActiveCyclesUpgrade />}
    >
      <WorkspaceActiveCyclesList />
    </WithFeatureFlagHOC>
  );
};
