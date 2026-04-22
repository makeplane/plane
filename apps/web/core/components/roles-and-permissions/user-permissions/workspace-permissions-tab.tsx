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

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { getPermissionGroupsByNamespace } from "@plane/constants";
import { permissionsToMatrixState } from "@plane/utils";
// hooks
import { usePermissionGroupAccess } from "@/hooks/permissions/use-permission-group-access";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useRoleManagement } from "@/hooks/store/use-role-management";
// local imports
import { PermissionMatrixTable } from "./permission-matrix-table";

type Props = {
  workspaceSlug: string;
};

export const WorkspacePermissionsTab = observer(function WorkspacePermissionsTab({ workspaceSlug }: Props) {
  // store hooks
  const { getCurrentUserWorkspaceRoleSlug, getCurrentUserWorkspacePermissionGrants } = usePermissionAccess();
  const { getWorkspaceRoleDetailsByRoleSlug } = useRoleManagement();
  const { filterGroups } = usePermissionGroupAccess(workspaceSlug, "workspace");
  // derived values
  const relationSlug = getCurrentUserWorkspaceRoleSlug(workspaceSlug);
  const grants = getCurrentUserWorkspacePermissionGrants(workspaceSlug);
  const roleDetails = relationSlug ? getWorkspaceRoleDetailsByRoleSlug(workspaceSlug, relationSlug) : undefined;
  const roleLabel = roleDetails?.name ?? relationSlug ?? "";

  const visibleGroups = useMemo(() => filterGroups(getPermissionGroupsByNamespace("workspace")), [filterGroups]);

  const matrixState = useMemo(() => {
    const grantRecord = Object.fromEntries((grants ?? []).map((g) => [g, true as const]));
    return permissionsToMatrixState(grantRecord, visibleGroups);
  }, [grants, visibleGroups]);

  return <PermissionMatrixTable groups={visibleGroups} matrixState={matrixState} roleLabel={roleLabel} />;
});
