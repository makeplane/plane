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

import { Outlet } from "react-router";
import useSWR from "swr";
// constants
import { WORKSPACE_PERMISSION_SCHEMES, WORKSPACE_ROLES } from "@/constants/fetch-keys";
// hooks
import { usePermissionScheme } from "@/hooks/store/use-permission-scheme";
import { useRoleManagement } from "@/hooks/store/use-role-management";
// types
import type { Route } from "./+types/layout";

export default function ProjectRolesAndSchemesLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // store hooks
  const { fetchAllWorkspaceRoles } = useRoleManagement();
  const { fetchAllWorkspaceSchemes } = usePermissionScheme();

  // Revalidate on entry so the list reflects any changes made elsewhere
  // since the workspace wrapper's initial fetch. Both project and workspace
  // scopes share the same fetcher (store splits by namespace internally).
  useSWR(
    workspaceSlug ? WORKSPACE_ROLES(workspaceSlug) : null,
    workspaceSlug ? () => fetchAllWorkspaceRoles(workspaceSlug) : null,
    { revalidateOnMount: true, revalidateOnFocus: false }
  );

  useSWR(
    workspaceSlug ? WORKSPACE_PERMISSION_SCHEMES(workspaceSlug) : null,
    workspaceSlug ? () => fetchAllWorkspaceSchemes(workspaceSlug) : null,
    { revalidateOnMount: true, revalidateOnFocus: false }
  );

  return <Outlet />;
}
