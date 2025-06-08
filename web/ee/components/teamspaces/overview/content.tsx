import { observer } from "mobx-react";
// plane imports
import { ContentWrapper, ERowVariant } from "@plane/ui";
// plane web components
import {
  TeamsOverviewProperties,
  TeamsOverviewQuickLinks,
  AddProjectsToTeam,
} from "@/plane-web/components/teamspaces/overview";
import { TeamspaceProgressRoot } from "@/plane-web/components/teamspaces/overview/progress/root";
import { TeamspaceRelationsRoot } from "@/plane-web/components/teamspaces/overview/relations/root";
import { TeamspaceStatisticsRoot } from "@/plane-web/components/teamspaces/overview/statistics/root";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

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
