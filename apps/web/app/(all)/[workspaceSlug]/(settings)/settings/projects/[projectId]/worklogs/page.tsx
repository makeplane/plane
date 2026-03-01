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

import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { WorkspaceWorklogRoot, WorkspaceWorklogsUpgrade } from "@/components/worklogs";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

import { WorklogsProjectSettingsHeader } from "./header";
import type { Route } from "./+types/page";

const WorklogsSettingsPage = observer(function WorklogsSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;

  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { currentProjectDetails } = useProject();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Worklogs` : undefined;
  const isFeatureEnabled = useFlag(workspaceSlug, "ISSUE_WORKLOG");
  const hasAdminPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  if (!currentWorkspace) return <></>;

  if (workspaceUserInfo && !hasAdminPermission) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <SettingsContentWrapper header={<WorklogsProjectSettingsHeader />} hugging={isFeatureEnabled}>
      <PageHead title={pageTitle} />
      <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag="ISSUE_WORKLOG" fallback={<WorkspaceWorklogsUpgrade />}>
        <WorkspaceWorklogRoot workspaceSlug={workspaceSlug} workspaceId={currentWorkspace.id} projectId={projectId} />
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
});

export default WorklogsSettingsPage;
