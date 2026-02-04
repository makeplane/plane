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
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { ContentWrapper, ERowVariant } from "@plane/ui";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";
// local imports
import { TeamsOverviewContent } from "./content";
import { TeamsOverviewSidebar } from "./sidebar/root";

type TTeamsOverviewRootProps = {
  teamspaceId: string;
};

export const TeamsOverviewRoot = observer(function TeamsOverviewRoot(props: TTeamsOverviewRootProps) {
  const { teamspaceId } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const { isCurrentUserMemberOfTeamspace, getTeamspaceById } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const isTeamspaceMember = isCurrentUserMemberOfTeamspace(teamspaceId);
  const isTeamspaceLead = currentUser?.id === teamspace?.lead_id;
  const hasAdminLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );

  return (
    <ContentWrapper variant={ERowVariant.HUGGING}>
      <div className="flex w-full h-full">
        <TeamsOverviewContent
          teamspaceId={teamspaceId}
          isEditingAllowed={(hasAdminLevelPermissions || isTeamspaceLead) && isTeamspaceMember}
        />
        {isTeamspaceMember && <TeamsOverviewSidebar teamspaceId={teamspaceId} />}
      </div>
    </ContentWrapper>
  );
});
