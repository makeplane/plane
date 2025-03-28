import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { ProjectSearch as ProjectWithoutGroupingSearch } from "@/components/project";
import HeaderFilters from "@/components/project/filters";
// hooks
import { useWorkspace } from "@/hooks/store";
// plane web components
import {
  ProjectAttributesDropdown,
  ProjectDisplayFiltersDropdown,
  ProjectSearch,
} from "@/plane-web/components/projects";
import UpdateTeamspaceProjectsButton from "@/plane-web/components/teamspaces/actions/projects/button";
// plane web hooks
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
// plane web types
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

type TeamspaceProjectListHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamspaceProjectListHeaderActions = observer((props: TeamspaceProjectListHeaderActionsProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const workspaceId = currentWorkspace?.id;
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    useFlag(workspaceSlug.toString(), "PROJECT_GROUPING");

  if (!workspaceSlug || !workspaceId) return;

  return (
    <>
      {isProjectGroupingEnabled ? (
        <>
          {/* search */}
          <ProjectSearch />
          <div className="hidden md:flex gap-4">
            {/* attributes dropdown */}
            <ProjectAttributesDropdown
              workspaceSlug={workspaceSlug.toString()}
              workspaceId={workspaceId}
              isArchived={false}
            />
            {/* display filters dropdown */}
            <ProjectDisplayFiltersDropdown workspaceSlug={workspaceSlug.toString()} isArchived={false} />
          </div>
        </>
      ) : (
        <>
          <ProjectWithoutGroupingSearch />
          <div className="hidden md:flex">
            <HeaderFilters />
          </div>
        </>
      )}
      {/* Add project button */}
      {isEditingAllowed && (
        <UpdateTeamspaceProjectsButton variant="header" teamspaceId={teamspaceId} isEditingAllowed={isEditingAllowed} />
      )}
    </>
  );
});
