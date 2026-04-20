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
import type { TProjectAppliedDisplayFilterKeys, TProjectFilters, IProject } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
import type { ProjectLayoutPermissions, ProjectItemPermissions } from "@/store/project/permissions/root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectFilter } from "@/hooks/store/use-project-filter";
import { useFavorite } from "@/hooks/store/use-favorite";
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
  const { totalProjectIds, filteredProjectIds, permissions } = useProject();
  const {
    currentWorkspaceFilters,
    currentWorkspaceAppliedDisplayFilters,
    clearAllFilters,
    clearAllAppliedDisplayFilters,
    updateFilters,
    updateDisplayFilters,
  } = useProjectFilter();
  const { permissions: favoritePermissions } = useFavorite();
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

  const layoutPermissions: ProjectLayoutPermissions = {
    canCreateProject: permissions.getCanCreate(workspaceSlug),
  };

  const getProjectItemPermissions = useCallback(
    (project: IProject): ProjectItemPermissions => ({
      canEdit: permissions.getCanEdit(workspaceSlug, project.id),
      canManage: permissions.getCanManage(workspaceSlug, project.id),
      canArchive: !project.archived_at && permissions.getCanArchive(workspaceSlug, project.id),
      canRestore: !!project.archived_at && permissions.getCanRestore(workspaceSlug, project.id),
      canDelete: permissions.getCanDelete(workspaceSlug, project.id),
      canFavorite: favoritePermissions.getCanCreate(workspaceSlug),
      canDragAndDrop: permissions.getCanDragAndDrop(workspaceSlug, project.id),
      canEditProperty: (property) => permissions.getCanEditProperty(workspaceSlug, project.id, property),
      canManageMembers: permissions.getCanManageMembers(workspaceSlug, project.id),
      canAccessMembersActivity: permissions.getCanAccessMembersActivity(workspaceSlug, project.id),
      canChangeRole: (targetRoleSlug: string) =>
        permissions.getCanChangeRole(workspaceSlug, project.id, targetRoleSlug),
      canRemoveMember: permissions.getCanRemoveMember(workspaceSlug, project.id),
      canLinkTeamspace: permissions.getCanLinkTeamspace(workspaceSlug, project.id),
      canRemoveTeamspace: permissions.getCanRemoveTeamspace(workspaceSlug, project.id),
      canEditIntake: permissions.getCanEditIntake(workspaceSlug, project.id),
      canManageIntake: permissions.getCanManageIntake(workspaceSlug, project.id),
    }),
    [favoritePermissions, permissions, workspaceSlug]
  );

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
      <ProjectCardList layoutPermissions={layoutPermissions} getProjectItemPermissions={getProjectItemPermissions} />
    </div>
  );
});
