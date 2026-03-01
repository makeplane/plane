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

import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TProjectAppliedDisplayFilterKeys, TProjectFilters } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectFilter } from "@/hooks/store/use-project-filter";
// local imports
import { ProjectAppliedFiltersList } from "./applied-filters";
import { ProjectCardList } from "./card-list";

type TProjectsListWithoutGroupingProps = {
  workspaceSlug: string;
  isArchived: boolean;
};

export const ProjectsListWithoutGrouping = observer(function ProjectsListWithoutGrouping(
  props: TProjectsListWithoutGroupingProps
) {
  const { workspaceSlug, isArchived } = props;
  // store
  const { totalProjectIds, filteredProjectIds } = useProject();
  const {
    currentWorkspaceFilters,
    currentWorkspaceAppliedDisplayFilters,
    clearAllFilters,
    clearAllAppliedDisplayFilters,
    updateFilters,
    updateDisplayFilters,
  } = useProjectFilter();

  const allowedDisplayFilters =
    currentWorkspaceAppliedDisplayFilters?.filter((filter) => filter !== "archived_projects") ?? [];

  const handleRemoveFilter = useCallback(
    (key: keyof TProjectFilters, value: string | null) => {
      let newValues = currentWorkspaceFilters?.[key] ?? [];

      if (!value) newValues = [];
      else newValues = newValues.filter((val) => val !== value);

      updateFilters(workspaceSlug, { [key]: newValues });
    },
    [currentWorkspaceFilters, updateFilters, workspaceSlug]
  );

  const handleRemoveDisplayFilter = useCallback(
    (key: TProjectAppliedDisplayFilterKeys) => {
      updateDisplayFilters(workspaceSlug, { [key]: false });
    },
    [updateDisplayFilters, workspaceSlug]
  );

  const handleClearAllFilters = useCallback(() => {
    clearAllFilters(workspaceSlug);
    clearAllAppliedDisplayFilters(workspaceSlug);
    if (isArchived) updateDisplayFilters(workspaceSlug, { archived_projects: true });
  }, [workspaceSlug, clearAllFilters, clearAllAppliedDisplayFilters, isArchived, updateDisplayFilters]);

  useEffect(() => {
    updateDisplayFilters(workspaceSlug, { archived_projects: isArchived });
  }, [isArchived, updateDisplayFilters, workspaceSlug]);

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
      <ProjectCardList />
    </div>
  );
});
