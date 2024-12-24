import { observer } from "mobx-react";
// plane web components
import { ContentWrapper, ERowVariant } from "@plane/ui";
import {
  TeamsOverviewProperties,
  TeamsOverviewQuickLinks,
  AddProjectsToTeam,
} from "@/plane-web/components/teams/overview";
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
        {areProjectsLinked ? <TeamsOverviewQuickLinks /> : <AddProjectsToTeam isEditingAllowed={isEditingAllowed} />}
      </div>
    </ContentWrapper>
  );
});
