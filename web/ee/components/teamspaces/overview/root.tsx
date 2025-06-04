"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
// ui
import { ContentWrapper, ERowVariant } from "@plane/ui";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web components
import { TeamsOverviewContent } from "@/plane-web/components/teamspaces/overview";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";
// components
import { TeamsOverviewSidebar } from "./sidebar/root";

type TTeamsOverviewRootProps = {
  teamspaceId: string;
};

export const TeamsOverviewRoot = observer((props: TTeamsOverviewRootProps) => {
  const { teamspaceId } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { allowPermissions } = useUserPermissions();
  const { isUserMemberOfTeamspace } = useTeamspaces();
  // derived values
  const isTeamspaceMember = isUserMemberOfTeamspace(teamspaceId);
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
          isEditingAllowed={hasAdminLevelPermissions && isTeamspaceMember}
        />
        {isTeamspaceMember && <TeamsOverviewSidebar teamspaceId={teamspaceId} />}
      </div>
    </ContentWrapper>
  );
});
