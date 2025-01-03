import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AvatarGroup, Avatar, LeadIcon, Logo, TeamsIcon, Tooltip, CustomEmojiIconPicker } from "@plane/ui";
// plane utils
import { convertHexEmojiToDecimal } from "@plane/utils";
// ui
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember } from "@/hooks/store";
// plane web components
import { JoinTeamButton } from "@/plane-web/components/teams/actions";
import AddTeamMembersButton from "@/plane-web/components/teams/actions/members/button";
import UpdateTeamProjectsButton from "@/plane-web/components/teams/actions/projects/button";
import { TeamDescriptionInput, TeamNameInput } from "@/plane-web/components/teams/overview";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";

type TTeamsOverviewPropertiesProps = {
  teamId: string;
  isEditingAllowed: boolean;
};

export const TeamsOverviewProperties = observer((props: TTeamsOverviewPropertiesProps) => {
  const { teamId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  // hooks
  const { getUserDetails } = useMember();
  const { isUserMemberOfTeam, getTeamById, updateTeam } = useTeams();
  // derived values
  const team = getTeamById(teamId?.toString());
  const isTeamMember = isUserMemberOfTeam(teamId);
  const teamLead = team?.lead_id ? getUserDetails(team.lead_id) : undefined;
  const teamDescription =
    team?.description_html !== undefined || team?.description_html !== null
      ? team?.description_html != ""
        ? team?.description_html
        : "<p></p>"
      : undefined;

  if (!team) return <></>;
  return (
    <div className="flex flex-col gap-y-2 p-4">
      <CustomEmojiIconPicker
        isOpen={isEmojiPickerOpen}
        handleToggle={(val: boolean) => setIsEmojiPickerOpen(val)}
        label={
          <div className="flex flex-shrink-0 size-12 items-center justify-center rounded-md bg-custom-background-90">
            {team.logo_props ? (
              <Logo logo={team.logo_props} size={24} />
            ) : (
              <TeamsIcon className="size-6 text-custom-text-300" />
            )}
          </div>
        }
        onChange={(val) => {
          let logoValue = {};
          if (val?.type === "emoji")
            logoValue = {
              value: convertHexEmojiToDecimal(val.value.unified),
              url: val.value.imageUrl,
            };
          else if (val?.type === "icon") logoValue = val.value;
          updateTeam(workspaceSlug.toString(), teamId, {
            logo_props: {
              in_use: val?.type,
              [val?.type]: logoValue,
            },
          });
          setIsEmojiPickerOpen(false);
        }}
        disabled={!isEditingAllowed}
      />
      <TeamNameInput
        value={team.name}
        workspaceSlug={workspaceSlug.toString()}
        teamId={teamId}
        disabled={!isEditingAllowed}
      />
      <TeamDescriptionInput
        initialValue={teamDescription}
        workspaceSlug={workspaceSlug.toString()}
        teamId={teamId}
        disabled={!isEditingAllowed}
        containerClassName="-ml-3 border-none"
      />
      <div className="flex items-center justify-between gap-x-2 py-4">
        <div className="flex items-center gap-x-2">
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
              {team.member_ids?.map((userId: string) => {
                const userDetails = getUserDetails(userId);
                if (!userDetails) return;
                return <Avatar key={userId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />;
              })}
            </AvatarGroup>
          </div>
          <AddTeamMembersButton teamId={teamId?.toString()} variant="icon" isEditingAllowed={isEditingAllowed} />
        </div>
        <div className="flex items-center gap-x-2">
          {isTeamMember ? (
            <UpdateTeamProjectsButton teamId={teamId?.toString()} isEditingAllowed={isEditingAllowed} />
          ) : (
            <JoinTeamButton teamId={teamId?.toString()} />
          )}
        </div>
      </div>
    </div>
  );
});
