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
import { ContentWrapper, ERowVariant } from "@plane/ui";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";
// types
import type { TTeamspaceDetailPermissions } from "@/store/teamspace/permissions/root";
// local imports
import { TeamsOverviewContent } from "./content";
import { TeamsOverviewSidebar } from "./sidebar/root";

type TTeamsOverviewRootProps = {
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamsOverviewRoot = observer(function TeamsOverviewRoot(props: TTeamsOverviewRootProps) {
  const { teamspaceId, workspaceSlug } = props;
  // hooks
  const { isCurrentUserMemberOfTeamspace, permissions } = useTeamspaces();
  // derived values
  const isTeamspaceMember = isCurrentUserMemberOfTeamspace(teamspaceId);
  const commentPerms = permissions.getCommentPermissions(workspaceSlug, teamspaceId);
  const overviewPermissions: TTeamspaceDetailPermissions = {
    canEdit: permissions.getCanEdit(workspaceSlug, teamspaceId),
    canDelete: permissions.getCanDelete(workspaceSlug, teamspaceId),
    canManage: permissions.getCanManage(workspaceSlug, teamspaceId),
    canEditProperty: (property) => permissions.getCanEditProperty(workspaceSlug, teamspaceId, property),
    canAddMember: permissions.getCanAddMember(workspaceSlug, teamspaceId),
    canRemoveMember: permissions.getCanRemoveMember(workspaceSlug, teamspaceId),
    canAddProject: permissions.getCanAddProject(workspaceSlug, teamspaceId),
    canRemoveProject: permissions.getCanRemoveProject(workspaceSlug, teamspaceId),
    canCreateWorkItem: permissions.getCanCreateWorkItem(workspaceSlug, teamspaceId),
    canCreateView: permissions.getViewPermissions(workspaceSlug, teamspaceId).canCreate,
    canCreatePage: permissions.getCanCreatePage(workspaceSlug),
    comments: {
      canCreate: commentPerms.canCreate,
      canEdit: (id) => commentPerms.getCanEdit(id),
      canDelete: (id) => commentPerms.getCanDelete(id),
      canReact: (id) => commentPerms.getCanReact(id),
    },
  };

  return (
    <ContentWrapper variant={ERowVariant.HUGGING}>
      <div className="flex w-full h-full">
        <TeamsOverviewContent teamspaceId={teamspaceId} permissions={overviewPermissions} />
        {isTeamspaceMember && (
          <TeamsOverviewSidebar
            teamspaceId={teamspaceId}
            workspaceSlug={workspaceSlug}
            permissions={overviewPermissions}
          />
        )}
      </div>
    </ContentWrapper>
  );
});
