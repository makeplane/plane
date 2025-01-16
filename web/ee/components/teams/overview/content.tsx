import { observer } from "mobx-react";
// plane imports
import { ContentWrapper, ERowVariant } from "@plane/ui";
// plane web components
import {
  TeamsOverviewProperties,
  TeamsOverviewQuickLinks,
  AddProjectsToTeam,
} from "@/plane-web/components/teams/overview";
import { TeamProgressRoot } from "@/plane-web/components/teams/overview/progress/root";
import { TeamRelationsRoot } from "@/plane-web/components/teams/overview/relations/root";
import { TeamStatisticsRoot } from "@/plane-web/components/teams/overview/statistics/root";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";

type TTeamsOverviewContentProps = {
  teamId: string;
  isEditingAllowed: boolean;
};

export const TeamsOverviewContent = observer((props: TTeamsOverviewContentProps) => {
  const { teamId, isEditingAllowed } = props;
  // hooks
  const { getTeamById, isUserMemberOfTeam } = useTeams();
  // derived values
  const team = getTeamById(teamId?.toString());
  const isTeamMember = isUserMemberOfTeam(teamId);
  const areProjectsLinked = team?.project_ids && team.project_ids.length > 0;

  if (!team) return <></>;

  // If user is not a member of the team, return
  if (!isTeamMember)
    return (
      <ContentWrapper variant={ERowVariant.REGULAR}>
        <TeamsOverviewProperties teamId={teamId} isEditingAllowed={false} />
      </ContentWrapper>
    );

  return (
    <ContentWrapper variant={ERowVariant.REGULAR}>
      <div className="flex flex-col gap-y-2">
        <TeamsOverviewProperties teamId={teamId} isEditingAllowed={isEditingAllowed} />
        {areProjectsLinked ? (
          <div className="flex flex-col divide-y divide-custom-border-100 px-3">
            <TeamsOverviewQuickLinks />
            <TeamProgressRoot teamId={teamId} />
            <TeamRelationsRoot teamId={teamId} />
            <TeamStatisticsRoot teamId={teamId} />
          </div>
        ) : (
          <AddProjectsToTeam isEditingAllowed={isEditingAllowed} />
        )}
      </div>
    </ContentWrapper>
  );
});
