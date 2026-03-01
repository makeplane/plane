/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane imports
import { TrashIcon, LeadIcon } from "@plane/propel/icons";
import { setPromiseToast } from "@plane/propel/toast";
import { Avatar, CustomMenu } from "@plane/ui";
// helpers
import { cn, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web components
import { AddTeamspaceMembersButton } from "@/components/teamspaces/actions/members/button";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

export type TTeamsOverviewSidebarMembersProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamsOverviewSidebarMembers = observer(function TeamsOverviewSidebarMembers(
  props: TTeamsOverviewSidebarMembersProps
) {
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
      const isCurrentUser = currentUser?.id === memberId;
      if (isCurrentUser) router.push(`/${workspaceSlug}/teamspaces`);
    });
  };

  return (
    <div className="relative flex flex-col w-full h-full gap-y-2 ">
      <div className="flex items-center gap-1.5 text-13 font-semibold">Members</div>
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
                      className="text-body-xs-regular"
                      showTooltip={false}
                    />
                    {isTeamspaceLead && (
                      <LeadIcon className="flex-shrink-0 absolute top-0 -left-0.5 size-4 rounded-full" />
                    )}
                  </span>
                  <span className="text-body-xs-medium text-secondary">
                    {member.first_name} {member.last_name}
                  </span>
                </div>
                {isEditingAllowed && !isTeamspaceLead && (
                  <div className="flex-shrink-0">
                    <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
                      <CustomMenu.MenuItem
                        onClick={() => {
                          handleMemberLeaveOrRemove(member.id);
                        }}
                        className={cn("flex items-center gap-2 text-danger-primary")}
                        disabled={!isEditingAllowed}
                      >
                        <TrashIcon className="h-3 w-3" />
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
