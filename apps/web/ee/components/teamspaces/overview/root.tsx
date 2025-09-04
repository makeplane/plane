"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { ContentWrapper, ERowVariant } from "@plane/ui";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";
// local imports
import { TeamsOverviewContent } from "./content";
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
  const { isCurrentUserMemberOfTeamspace } = useTeamspaces();
  // derived values
  const isTeamspaceMember = isCurrentUserMemberOfTeamspace(teamspaceId);
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
