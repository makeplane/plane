import { useEffect } from "react";
import { observer } from "mobx-react";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web components
import { WorkspaceProjectsRoot } from "@/plane-web/components/projects";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
// plane web types
import { EProjectFilters, EProjectLayouts, EProjectScope } from "@/plane-web/types/workspace-project-filters";

export type TTeamspaceProjectsWithGroupingRootProps = {
  workspaceSlug: string;
};

export const TeamspaceProjectsWithGroupingRoot = observer((props: TTeamspaceProjectsWithGroupingRootProps) => {
  const { workspaceSlug } = props;
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { updateScope, updateAttributes, updateLayout, filters } = useProjectFilter();
  // derived values
  const currentWorkspaceId = currentWorkspace?.id;

  useEffect(() => {
    const currentLayout = filters?.layout ?? EProjectLayouts.TABLE;
    const currentScope = filters?.scope ?? EProjectScope.ALL_PROJECTS;
    updateLayout(workspaceSlug.toString(), EProjectLayouts.TABLE, false, false);
    updateScope(workspaceSlug.toString(), EProjectScope.TEAMSPACE_PROJECTS, false);
    return () => {
      updateScope(workspaceSlug.toString(), currentScope, false);
      updateLayout(workspaceSlug.toString(), currentLayout, false, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateScope, updateAttributes, updateLayout, workspaceSlug]);

  if (!currentWorkspaceId) return null;
  return (
    <div className="h-full w-full overflow-hidden">
      <WorkspaceProjectsRoot
        workspaceSlug={workspaceSlug.toString()}
        workspaceId={currentWorkspaceId}
        isArchived={false}
        filtersToInit={[EProjectFilters.ATTRIBUTES, EProjectFilters.DISPLAY_FILTERS]}
      />
    </div>
  );
});
