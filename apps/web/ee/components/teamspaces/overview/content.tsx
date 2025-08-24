import { observer } from "mobx-react";
// plane imports
import { ContentWrapper, ERowVariant } from "@plane/ui";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";
// local imports
import { AddProjectsToTeam } from "./add-projects";
import { TeamspaceProgressRoot } from "./progress/root";
import { TeamsOverviewProperties } from "./properties";
import { TeamsOverviewQuickLinks } from "./quick-links";
import { TeamspaceRelationsRoot } from "./relations/root";
import { TeamspaceStatisticsRoot } from "./statistics/root";

type TTeamsOverviewContentProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamsOverviewContent = observer((props: TTeamsOverviewContentProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // hooks
  const { getTeamspaceById, isCurrentUserMemberOfTeamspace } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId?.toString());
  const isTeamspaceMember = isCurrentUserMemberOfTeamspace(teamspaceId);
  const areProjectsLinked = teamspace?.project_ids && teamspace.project_ids.length > 0;

  if (!teamspace) return <></>;

  // If user is not a member of the teamspace, return
  if (!isTeamspaceMember)
    return (
      <ContentWrapper variant={ERowVariant.REGULAR}>
        <TeamsOverviewProperties teamspaceId={teamspaceId} isEditingAllowed={false} />
      </ContentWrapper>
    );

  return (
    <ContentWrapper variant={ERowVariant.REGULAR}>
      <div className="flex flex-col gap-y-2">
        <TeamsOverviewProperties teamspaceId={teamspaceId} isEditingAllowed={isEditingAllowed} />
        {areProjectsLinked ? (
          <div className="flex flex-col divide-y divide-custom-border-100 px-3">
            <TeamsOverviewQuickLinks />
            <TeamspaceProgressRoot teamspaceId={teamspaceId} />
            <TeamspaceRelationsRoot teamspaceId={teamspaceId} />
            <TeamspaceStatisticsRoot teamspaceId={teamspaceId} />
          </div>
        ) : (
          <AddProjectsToTeam isEditingAllowed={isEditingAllowed} />
        )}
      </div>
    </ContentWrapper>
  );
});
