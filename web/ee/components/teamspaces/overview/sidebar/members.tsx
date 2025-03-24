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
import AddTeamspaceMembersButton from "@/plane-web/components/teamspaces/actions/members/button";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

export type TTeamsOverviewSidebarMembersProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamsOverviewSidebarMembers = observer((props: TTeamsOverviewSidebarMembersProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // hooks
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();
  const { getTeamspaceById, removeTeamspaceMember } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  if (!teamspace) return null;

  const members = useMemo(
    () =>
      teamspace.member_ids
        ?.map((memberId) => getUserDetails(memberId))
        .filter(Boolean)
        .sort((a, b) => (a?.id === teamspace.lead_id ? -1 : b?.id === teamspace.lead_id ? 1 : 0)),
    [teamspace.member_ids, getUserDetails, teamspace.lead_id]
  );

  const handleMemberLeaveOrRemove = async (memberId: string) => {
    const removeTeamspaceMemberPromise = removeTeamspaceMember(workspaceSlug?.toString(), teamspace.id, memberId);
    setPromiseToast(removeTeamspaceMemberPromise, {
      loading: "Removing member from teamspace...",
      success: {
        title: "Success",
        message: () => "Member removed from teamspace",
      },
      error: {
        title: "Failed",
        message: () => "Failed to remove member from teamspace",
      },
    });
    await removeTeamspaceMemberPromise.then(() => {
      if (currentUser?.id === memberId) router.push(`/${workspaceSlug}/teamspaces`);
    });
  };

  return (
    <div className="relative flex flex-col w-full h-full gap-y-2 pt-2 px-6">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <span>Members</span>
        <Tooltip
          position="right"
          tooltipContent="Members in this teamspace can't be removed from linked projects without removing them from this teamspace first."
          className="max-w-64"
        >
          <InfoIcon className="size-3 text-custom-text-300 hover:text-custom-text-200 outline-none cursor-help" />
        </Tooltip>
      </div>
      <div className="flex-1 flex flex-col py-2 px-0.5 gap-x-2 gap-y-5 overflow-y-auto">
        <AddTeamspaceMembersButton teamspaceId={teamspace.id} variant="sidebar" isEditingAllowed={isEditingAllowed} />
        {members &&
          members.length > 0 &&
          members.map((member) => {
            if (!member) return null;
            const isTeamspaceLead = member.id === teamspace.lead_id;
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
                    {isTeamspaceLead && (
                      <LeadIcon className="flex-shrink-0 absolute top-0 -left-0.5 size-4 rounded-full" />
                    )}
                  </span>
                  <span className="text-sm font-medium text-custom-text-200">
                    {member.first_name} {member.last_name}
                  </span>
                </div>
                {isEditingAllowed && !isTeamspaceLead && (
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
