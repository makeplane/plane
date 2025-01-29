import { useCallback } from "react";
import { observer } from "mobx-react";
// types
import { TProjectAppliedDisplayFilterKeys, TProjectFilters, TTeam } from "@plane/types";
// components
import { ProjectAppliedFiltersList, ProjectCardList } from "@/components/project";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useProject, useProjectFilter } from "@/hooks/store";

export type TTeamProjectsWithoutGroupingRootProps = {
  workspaceSlug: string;
  team: TTeam;
};

export const TeamProjectsWithoutGroupingRoot = observer((props: TTeamProjectsWithoutGroupingRootProps) => {
  const { workspaceSlug, team } = props;
  // hooks
  const { totalProjectIds: storeTotalProjectIds, filteredProjectIds: storeFilteredProjectIds } = useProject();
  const {
    currentWorkspaceFilters,
    currentWorkspaceAppliedDisplayFilters,
    clearAllFilters,
    clearAllAppliedDisplayFilters,
    updateFilters,
    updateDisplayFilters,
  } = useProjectFilter();
  // derived values
  const teamProjectIds = team?.project_ids ?? [];
  const totalProjectIds = storeTotalProjectIds?.filter((id) => teamProjectIds.includes(id)) ?? [];
  const filteredProjectIds = storeFilteredProjectIds?.filter((id) => teamProjectIds.includes(id)) ?? [];

  const allowedDisplayFilters =
    currentWorkspaceAppliedDisplayFilters?.filter((filter) => filter !== "archived_projects") ?? [];

  const handleRemoveFilter = useCallback(
    (key: keyof TProjectFilters, value: string | null) => {
      if (!workspaceSlug) return;
      let newValues = currentWorkspaceFilters?.[key] ?? [];

      if (!value) newValues = [];
      else newValues = newValues.filter((val) => val !== value);

      updateFilters(workspaceSlug.toString(), { [key]: newValues });
    },
    [currentWorkspaceFilters, updateFilters, workspaceSlug]
  );

  const handleRemoveDisplayFilter = useCallback(
    (key: TProjectAppliedDisplayFilterKeys) => {
      if (!workspaceSlug) return;
      updateDisplayFilters(workspaceSlug.toString(), { [key]: false });
    },
    [updateDisplayFilters, workspaceSlug]
  );

  const handleClearAllFilters = useCallback(() => {
    if (!workspaceSlug) return;
    clearAllFilters(workspaceSlug.toString());
    clearAllAppliedDisplayFilters(workspaceSlug.toString());
  }, [clearAllFilters, clearAllAppliedDisplayFilters, workspaceSlug]);

  return (
    <div className="flex h-full w-full flex-col">
      {(calculateTotalFilters(currentWorkspaceFilters ?? {}) !== 0 || allowedDisplayFilters.length > 0) && (
        <ProjectAppliedFiltersList
          appliedFilters={currentWorkspaceFilters ?? {}}
          appliedDisplayFilters={allowedDisplayFilters}
          handleClearAllFilters={handleClearAllFilters}
          handleRemoveFilter={handleRemoveFilter}
          handleRemoveDisplayFilter={handleRemoveDisplayFilter}
          filteredProjects={filteredProjectIds?.length ?? 0}
          totalProjects={totalProjectIds?.length ?? 0}
          alwaysAllowEditing
        />
      )}
      <ProjectCardList totalProjectIds={totalProjectIds} filteredProjectIds={filteredProjectIds} />
    </div>
  );
});
