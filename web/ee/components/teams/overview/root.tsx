"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { ContentWrapper, ERowVariant } from "@plane/ui";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web components
import { TeamsOverviewContent } from "@/plane-web/components/teams/overview";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";
// components
import { TeamsOverviewSidebar } from "./sidebar/root";

type TTeamsOverviewRootProps = {
  teamId: string;
};

export const TeamsOverviewRoot = observer((props: TTeamsOverviewRootProps) => {
  const { teamId } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { allowPermissions } = useUserPermissions();
  const { isUserMemberOfTeam } = useTeams();
  // derived values
  const isTeamMember = isUserMemberOfTeam(teamId);
  const hasAdminLevelPermissions = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );

  return (
    <ContentWrapper variant={ERowVariant.HUGGING}>
      <div className="flex w-full h-full">
        <TeamsOverviewContent teamId={teamId} isEditingAllowed={hasAdminLevelPermissions && isTeamMember} />
        {isTeamMember && <TeamsOverviewSidebar teamId={teamId} />}
      </div>
    </ContentWrapper>
  );
});
