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
import { WorkspaceAnalyticsTimesheetGrid } from "@/plane-web/components/time-tracking/analytics";
// hooks
import { useUserPermissions } from "@/hooks/store/user/user-permissions";

const WorkspaceAnalyticsPage = observer(function WorkspaceAnalyticsPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { allowPermissions } = useUserPermissions();

  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);
  if (!isAdmin) return <Navigate to={`/${workspaceSlug}/time-tracking`} replace />;

  return (
    <>
      <PageHead title="Workspace Analytics" />
      <WorkspaceAnalyticsTimesheetGrid workspaceSlug={workspaceSlug!} />
    </>
  );
});

export default WorkspaceAnalyticsPage;
