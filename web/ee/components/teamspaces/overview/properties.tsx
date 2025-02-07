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
import { JoinTeamspaceButton } from "@/plane-web/components/teamspaces/actions";
import AddTeamspaceMembersButton from "@/plane-web/components/teamspaces/actions/members/button";
import UpdateTeamspaceProjectsButton from "@/plane-web/components/teamspaces/actions/projects/button";
import { TeamspaceDescriptionInput, TeamNameInput } from "@/plane-web/components/teamspaces/overview";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

type TTeamsOverviewPropertiesProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamsOverviewProperties = observer((props: TTeamsOverviewPropertiesProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  // hooks
  const { getUserDetails } = useMember();
  const { isUserMemberOfTeamspace, getTeamspaceById, updateTeamspace } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId?.toString());
  const isTeamspaceMember = isUserMemberOfTeamspace(teamspaceId);
  const teamLead = teamspace?.lead_id ? getUserDetails(teamspace.lead_id) : undefined;
  const teamspaceMemberIdsExceptLead = teamspace?.member_ids?.filter((memberId) => memberId !== teamLead?.id);
  const teamspaceDescription =
    teamspace?.description_html !== undefined || teamspace?.description_html !== null
      ? teamspace?.description_html != ""
        ? teamspace?.description_html
        : "<p></p>"
      : undefined;

  if (!teamspace) return <></>;
  return (
    <div className="flex flex-col gap-y-2 p-4">
      <CustomEmojiIconPicker
        isOpen={isEmojiPickerOpen}
        handleToggle={(val: boolean) => setIsEmojiPickerOpen(val)}
        label={
          <div className="flex flex-shrink-0 size-12 items-center justify-center rounded-md bg-custom-background-90">
            {teamspace.logo_props ? (
              <Logo logo={teamspace.logo_props} size={24} />
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
          updateTeamspace(workspaceSlug.toString(), teamspaceId, {
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
        value={teamspace.name}
        workspaceSlug={workspaceSlug.toString()}
        teamspaceId={teamspaceId}
        disabled={!isEditingAllowed}
      />
      <TeamspaceDescriptionInput
        initialValue={teamspaceDescription}
        workspaceSlug={workspaceSlug.toString()}
        teamspaceId={teamspaceId}
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
              {teamspaceMemberIdsExceptLead?.map((userId: string) => {
                const userDetails = getUserDetails(userId);
                if (!userDetails) return;
                return <Avatar key={userId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />;
              })}
            </AvatarGroup>
          </div>
          <AddTeamspaceMembersButton
            teamspaceId={teamspaceId?.toString()}
            variant="icon"
            isEditingAllowed={isEditingAllowed}
          />
        </div>
        <div className="flex items-center gap-x-2">
          {isTeamspaceMember ? (
            <UpdateTeamspaceProjectsButton teamspaceId={teamspaceId?.toString()} isEditingAllowed={isEditingAllowed} />
          ) : (
            <JoinTeamspaceButton teamspaceId={teamspaceId?.toString()} />
          )}
        </div>
      </div>
    </div>
  );
});
