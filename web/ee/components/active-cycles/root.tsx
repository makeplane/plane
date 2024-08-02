// plane web components
import { WorkspaceActiveCyclesList, WorkspaceActiveCyclesUpgrade } from "@/plane-web/components/active-cycles";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";

export const WorkspaceActiveCyclesRoot = () => (
  <WithFeatureFlagHOC flag="WORKSPACE_ACTIVE_CYCLES" fallback={<WorkspaceActiveCyclesUpgrade />}>
    <WorkspaceActiveCyclesList />
  </WithFeatureFlagHOC>
)
