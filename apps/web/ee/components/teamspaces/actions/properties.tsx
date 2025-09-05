import { observer } from "mobx-react";
// plane imports
import { TEAMSPACE_TRACKER_ELEMENTS } from "@plane/constants";
import { LeadIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { Avatar, AvatarGroup } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web components
import { UpdateTeamspaceProjectsButton } from "@/plane-web/components/teamspaces/actions/projects/button";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces";

type TTeamPropertiesProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamProperties = observer((props: TTeamPropertiesProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // hooks
  const { getUserDetails } = useMember();
  // plane web hooks
  const { getTeamspaceById } = useTeamspaces();
  // teamspace details
  const teamspace = getTeamspaceById(teamspaceId);
  if (!teamspace) return null;
  // derived values
  const teamLead = teamspace.lead_id ? getUserDetails(teamspace.lead_id) : null;
  const teamspaceMemberIdsExceptLead = teamspace?.member_ids?.filter((memberId) => memberId !== teamLead?.id);

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
        <AvatarGroup size="base" showTooltip max={4}>
          {teamspaceMemberIdsExceptLead?.map((userId: string) => {
            const userDetails = getUserDetails(userId);
            if (!userDetails) return;
            return <Avatar key={userId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />;
          })}
        </AvatarGroup>
      </div>
      <UpdateTeamspaceProjectsButton
        teamspaceId={teamspaceId}
        isEditingAllowed={isEditingAllowed}
        trackerElement={TEAMSPACE_TRACKER_ELEMENTS.LIST_ITEM_UPDATE_PROJECT_BUTTON}
      />
    </div>
  );
});
