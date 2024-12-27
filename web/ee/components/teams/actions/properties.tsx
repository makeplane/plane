import { observer } from "mobx-react";
// ui
import { Avatar, AvatarGroup, LeadIcon, Tooltip } from "@plane/ui";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember } from "@/hooks/store";
// plane web components
import UpdateTeamProjectsButton from "@/plane-web/components/teams/actions/projects/button";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store/teams";

type TTeamPropertiesProps = {
  teamId: string;
  isEditingAllowed: boolean;
};

export const TeamProperties = observer((props: TTeamPropertiesProps) => {
  const { teamId, isEditingAllowed } = props;
  // hooks
  const { getUserDetails } = useMember();
  // plane web hooks
  const { getTeamById } = useTeams();
  // team details
  const team = getTeamById(teamId);
  if (!team) return null;
  // derived values
  const teamLead = team.lead_id ? getUserDetails(team.lead_id) : null;

  return (
    <div className="flex flex-shrink-0 items-center justify-end gap-2.5">
      {teamLead && (
        <Tooltip tooltipContent={`${teamLead.first_name} ${teamLead.last_name} (Lead)`} position="bottom">
          <span className="flex-shrink-0 relative">
            <Avatar
              key={teamLead.id}
              name={teamLead.display_name}
              src={getFileURL(teamLead.avatar_url)}
              size={26}
              className="text-xs"
              showTooltip={false}
            />
            <LeadIcon className="flex-shrink-0 absolute top-0 -left-2.5 size-4 rounded-full" />
          </span>
        </Tooltip>
      )}
      <div className="flex-shrink-0">
        <AvatarGroup size="base" showTooltip>
          {team.member_ids?.map((userId: string) => {
            const userDetails = getUserDetails(userId);
            if (!userDetails) return;
            return <Avatar key={userId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />;
          })}
        </AvatarGroup>
      </div>
      <UpdateTeamProjectsButton teamId={teamId} isEditingAllowed={isEditingAllowed} />
    </div>
  );
});
