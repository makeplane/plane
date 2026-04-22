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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { getPermissionGroupsByNamespace } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyState } from "@plane/propel/empty-state";
import { InfoIcon } from "@plane/propel/icons";
import { permissionsToMatrixState } from "@plane/utils";
// components
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
// hooks
import { usePermissionGroupAccess } from "@/hooks/permissions/use-permission-group-access";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useProject } from "@/hooks/store/use-project";
import { useRoleManagement } from "@/hooks/store/use-role-management";
// local imports
import { PermissionMatrixTable } from "./permission-matrix-table";

type Props = {
  workspaceSlug: string;
};

const ELEVATED_WORKSPACE_SLUGS = new Set(["admin", "owner"]);

const capitalize = (value: string): string =>
  value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);

export const ProjectPermissionsTab = observer(function ProjectPermissionsTab({ workspaceSlug }: Props) {
  // states
  const [userSelectedProjectId, setUserSelectedProjectId] = useState<string | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getCurrentUserWorkspaceRoleSlug, getCurrentUserProjectRoleSlug, getCurrentUserProjectPermissionGrants } =
    usePermissionAccess();
  const { getProjectRoleDetailsByRoleSlug } = useRoleManagement();
  const { filterGroups } = usePermissionGroupAccess(workspaceSlug, "project");
  const { joinedProjectIds } = useProject();
  // state — stores the user's explicit choice; null means "use default"
  const selectedProjectId =
    userSelectedProjectId && joinedProjectIds.includes(userSelectedProjectId)
      ? userSelectedProjectId
      : (joinedProjectIds[0] ?? null);

  // derived values
  const workspaceRelationSlug = getCurrentUserWorkspaceRoleSlug(workspaceSlug);
  const projectRelationSlug = selectedProjectId ? getCurrentUserProjectRoleSlug(selectedProjectId) : undefined;
  const isProjectAdmin = projectRelationSlug === "admin";
  const isElevated = !!workspaceRelationSlug && ELEVATED_WORKSPACE_SLUGS.has(workspaceRelationSlug) && !isProjectAdmin;
  const grants = selectedProjectId ? getCurrentUserProjectPermissionGrants(selectedProjectId) : undefined;
  const projectRoleDetails = projectRelationSlug
    ? getProjectRoleDetailsByRoleSlug(workspaceSlug, projectRelationSlug)
    : undefined;
  const projectRoleLabel = projectRoleDetails?.name ?? projectRelationSlug ?? "";

  const visibleGroups = useMemo(() => filterGroups(getPermissionGroupsByNamespace("project")), [filterGroups]);

  const matrixState = useMemo(() => {
    const grantRecord = Object.fromEntries((grants ?? []).map((g) => [g, true as const]));
    return permissionsToMatrixState(grantRecord, visibleGroups);
  }, [grants, visibleGroups]);

  const elevationMessage = workspaceRelationSlug
    ? t("workspace_settings.settings.permissions.elevation_banner", {
        role: capitalize(workspaceRelationSlug),
      })
    : "";

  if (joinedProjectIds.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          assetKey="project"
          title={t("workspace_settings.settings.permissions.no_joined_projects_title")}
          description={t("workspace_settings.settings.permissions.no_joined_projects_description")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-body-sm-regular text-secondary">
          {t("workspace_settings.settings.permissions.project_picker_label")}
        </span>
        <ProjectDropdown
          multiple={false}
          value={selectedProjectId}
          onChange={(val) => setUserSelectedProjectId(val)}
          buttonVariant="border-with-text"
          buttonClassName="h-6 rounded-md"
          dropdownArrow
        />
      </div>
      {isElevated && (
        // TODO: <@plane/propel> Update this to use the Banner component
        <div className="flex items-center gap-2 rounded-lg bg-layer-1 px-4 py-3 text-body-sm-regular text-tertiary">
          <InfoIcon className="size-4 shrink-0 text-tertiary" />
          <span>{elevationMessage}</span>
        </div>
      )}
      <PermissionMatrixTable groups={visibleGroups} matrixState={matrixState} roleLabel={projectRoleLabel} />
    </div>
  );
});
