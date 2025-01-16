import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { InfoIcon, Trash2 } from "lucide-react";
// ui
import { Avatar, CustomMenu, LeadIcon, setPromiseToast, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web components
import AddTeamMembersButton from "@/plane-web/components/teams/actions/members/button";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";

export type TTeamsOverviewSidebarMembersProps = {
  teamId: string;
  isEditingAllowed: boolean;
};

export const TeamsOverviewSidebarMembers = observer((props: TTeamsOverviewSidebarMembersProps) => {
  const { teamId, isEditingAllowed } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // hooks
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();
  const { getTeamById, removeTeamMember } = useTeams();
  // derived values
  const team = getTeamById(teamId);
  if (!team) return null;

  const members = useMemo(
    () =>
      team.member_ids
        ?.map((memberId) => getUserDetails(memberId))
        .filter(Boolean)
        .sort((a, b) => (a?.id === team.lead_id ? -1 : b?.id === team.lead_id ? 1 : 0)),
    [team.member_ids, getUserDetails, team.lead_id]
  );

  const handleMemberLeaveOrRemove = async (memberId: string) => {
    const removeTeamMemberPromise = removeTeamMember(workspaceSlug?.toString(), team.id, memberId);
    setPromiseToast(removeTeamMemberPromise, {
      loading: "Removing member from team...",
      success: {
        title: "Success",
        message: () => "Member removed from team",
      },
      error: {
        title: "Failed",
        message: () => "Failed to remove member from team",
      },
    });
    await removeTeamMemberPromise.then(() => {
      if (currentUser?.id === memberId) router.push(`/${workspaceSlug}/teams`);
    });
  };

  return (
    <div className="relative flex flex-col w-full h-full gap-y-2 pt-2 px-6">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <span>Members</span>
        <Tooltip
          position="right"
          tooltipContent="Members in this team can't be removed from linked projects without removing them from this team first."
          className="max-w-64"
        >
          <InfoIcon className="size-3 text-custom-text-300 hover:text-custom-text-200 outline-none cursor-help" />
        </Tooltip>
      </div>
      <div className="flex-1 flex flex-col py-2 px-0.5 gap-x-2 gap-y-5 overflow-y-auto">
        <AddTeamMembersButton teamId={team.id} variant="sidebar" isEditingAllowed={isEditingAllowed} />
        {members &&
          members.length > 0 &&
          members.map((member) => {
            if (!member) return null;
            const isTeamLead = member.id === team.lead_id;
            return (
              <div className="flex items-center justify-between" key={member.id}>
                <div className="flex items-center gap-x-2">
                  <span className="flex-shrink-0 relative rounded-full">
                    <Avatar
                      key={member.id}
                      name={member.display_name}
                      src={getFileURL(member.avatar_url)}
                      size={32}
                      className="text-sm"
                      showTooltip={false}
                    />
                    {isTeamLead && <LeadIcon className="flex-shrink-0 absolute top-0 -left-0.5 size-4 rounded-full" />}
                  </span>
                  <span className="text-sm font-medium text-custom-text-200">
                    {member.first_name} {member.last_name}
                  </span>
                </div>
                {isEditingAllowed && !isTeamLead && (
                  <div className="flex-shrink-0">
                    <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
                      <CustomMenu.MenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMemberLeaveOrRemove(member.id);
                        }}
                        className={cn("flex items-center gap-2 text-red-500")}
                        disabled={!isEditingAllowed}
                      >
                        <Trash2 className="h-3 w-3" />
                        <div>{currentUser?.id === member.id ? "Leave" : "Remove"}</div>
                      </CustomMenu.MenuItem>
                    </CustomMenu>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
});
