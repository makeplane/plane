/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TProjectAppliedDisplayFilterKeys, TProjectFilters, TTeamspace } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
// components
import { ProjectAppliedFiltersList } from "@/components/projects/list/without-grouping/applied-filters";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectFilter } from "@/hooks/store/use-project-filter";
// local imports
import { TeamspaceProjectBlocksList } from "./block-list";

export type TTeamspaceProjectsWithoutGroupingRootProps = {
  workspaceSlug: string;
  teamspace: TTeamspace;
};

export const TeamspaceProjectsWithoutGroupingRoot = observer(function TeamspaceProjectsWithoutGroupingRoot(
  props: TTeamspaceProjectsWithoutGroupingRootProps
) {
  const { workspaceSlug, teamspace } = props;
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
  const teamspaceProjectIds = teamspace?.project_ids ?? [];
  const totalProjectIds = storeTotalProjectIds?.filter((id) => teamspaceProjectIds.includes(id)) ?? [];
  const filteredProjectIds = storeFilteredProjectIds?.filter((id) => teamspaceProjectIds.includes(id)) ?? [];

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
      <TeamspaceProjectBlocksList projectIds={filteredProjectIds} teamspaceId={teamspace.id} />
    </div>
  );
});
