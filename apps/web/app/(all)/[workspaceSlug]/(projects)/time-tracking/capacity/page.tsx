/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams, Navigate } from "react-router";
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
// components
import { PageHead } from "@/components/core/page-title";
import { CapacityDashboard } from "@/plane-web/components/time-tracking/capacity";
// hooks
import { useUserPermissions } from "@/hooks/store/user/user-permissions";

const WorkspaceCapacityPage = observer(function WorkspaceCapacityPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { allowPermissions } = useUserPermissions();

  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);
  if (!isAdmin) return <Navigate to={`/${workspaceSlug}/time-tracking`} replace />;

  return (
    <>
      <PageHead title="Capacity" />
      <CapacityDashboard workspaceSlug={workspaceSlug!} isWorkspaceMode />
    </>
  );
});

export default WorkspaceCapacityPage;
