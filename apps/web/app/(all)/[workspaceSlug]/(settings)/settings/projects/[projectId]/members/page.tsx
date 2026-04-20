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
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { ProjectMemberList } from "@/components/projects/settings/members/list";
import { ProjectSettingsMemberDefaults } from "@/components/projects/settings/members/defaults";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { ProjectTeamspaceList } from "@/components/projects/settings/teamspaces/teamspace-list";
// helpers
import { getProjectSettingsPageLabelI18nKey } from "@/helpers/settings/project";
// hooks
import { useProject } from "@/hooks/store/use-project";
// types
import type { Route } from "./+types/page";
// local imports
import { MembersProjectSettingsHeader } from "./header";

function MembersSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentProjectDetails, permissions: projectPermissions } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Members` : undefined;
  const permissions = {
    canManageMembers: projectPermissions.getCanManageMembers(workspaceSlug, projectId),
    canAccessMembersActivity: projectPermissions.getCanAccessMembersActivity(workspaceSlug, projectId),
    canChangeRole: (targetRoleSlug: string) =>
      projectPermissions.getCanChangeRole(workspaceSlug, projectId, targetRoleSlug),
    canRemoveMember: projectPermissions.getCanRemoveMember(workspaceSlug, projectId),
    canLinkTeamspace: projectPermissions.getCanLinkTeamspace(workspaceSlug, projectId),
    canRemoveTeamspace: projectPermissions.getCanRemoveTeamspace(workspaceSlug, projectId),
  };

  return (
    <SettingsContentWrapper header={<MembersProjectSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <SettingsHeading title={t(getProjectSettingsPageLabelI18nKey("members", "common.members"))} />
      <ProjectSettingsMemberDefaults projectId={projectId} workspaceSlug={workspaceSlug} permissions={permissions} />
      <ProjectTeamspaceList projectId={projectId} workspaceSlug={workspaceSlug} permissions={permissions} />
      <ProjectMemberList projectId={projectId} workspaceSlug={workspaceSlug} permissions={permissions} />
    </SettingsContentWrapper>
  );
}

export default observer(MembersSettingsPage);
