import { useEffect } from "react";
import { observer } from "mobx-react";
// hooks
import { useWorkspace } from "@/hooks/store";
// plane web components
import { WorkspaceProjectsRoot } from "@/plane-web/components/projects";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
// plane web types
import { EProjectLayouts, EProjectScope } from "@/plane-web/types/workspace-project-filters";

export type TTeamProjectsWithGroupingRootProps = {
  workspaceSlug: string;
};

export const TeamProjectsWithGroupingRoot = observer((props: TTeamProjectsWithGroupingRootProps) => {
  const { workspaceSlug } = props;
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { updateScope, updateAttributes, updateLayout } = useProjectFilter();
  // derived values
  const currentWorkspaceId = currentWorkspace?.id;

  useEffect(() => {
    updateScope(workspaceSlug.toString(), EProjectScope.TEAM_PROJECTS, false);
    updateLayout(workspaceSlug.toString(), EProjectLayouts.TABLE, false, false);
    return () => {
      updateScope(workspaceSlug.toString(), EProjectScope.MY_PROJECTS, false);
    };
  }, [updateScope, updateAttributes, updateLayout, workspaceSlug]);

  if (!currentWorkspaceId) return null;
  return (
    <div className="h-full w-full overflow-hidden">
      <WorkspaceProjectsRoot
        workspaceSlug={workspaceSlug.toString()}
        workspaceId={currentWorkspaceId}
        isArchived={false}
      />
    </div>
  );
});
