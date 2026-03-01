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

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// components
import { CountChip } from "@/components/common/count-chip";
import { MembersSettingsLoader } from "@/components/ui/loader/settings/members";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { WorkspaceInvitationsListItem } from "./invitations-list-item";
import { WorkspaceMembersListItem } from "./members-list-item";

export const WorkspaceMembersList = observer(function WorkspaceMembersList(props: {
  workspaceSlug: string;
  searchQuery: string;
  isAdmin: boolean;
}) {
  const { workspaceSlug, searchQuery, isAdmin } = props;
  const [showPendingInvites, setShowPendingInvites] = useState<boolean>(true);
  // store hooks
  const {
    workspace: {
      fetchWorkspaceMembers,
      fetchWorkspaceMemberInvitations,
      workspaceMemberIds,
      getFilteredWorkspaceMemberIds,
      getSearchedWorkspaceMemberIds,
      workspaceMemberInvitationIds,
      getSearchedWorkspaceInvitationIds,
      getWorkspaceMemberDetails,
    },
  } = useMember();
  const { t } = useTranslation();
  // fetching workspace invitations
  useSWR(`WORKSPACE_MEMBERS_AND_MEMBER_INVITATIONS_${workspaceSlug}`, async () => {
    await fetchWorkspaceMemberInvitations(workspaceSlug);
    await fetchWorkspaceMembers(workspaceSlug);
  });

  if (!workspaceMemberIds && !workspaceMemberInvitationIds) return <MembersSettingsLoader />;

  // derived values
  const filteredMemberIds = getFilteredWorkspaceMemberIds(workspaceSlug);
  const searchedMemberIds = searchQuery ? getSearchedWorkspaceMemberIds(searchQuery) : filteredMemberIds;
  const searchedInvitationsIds = getSearchedWorkspaceInvitationIds(searchQuery);
  const memberDetails = searchedMemberIds
    ?.map((memberId) => getWorkspaceMemberDetails(memberId))
    .sort((a, b) => {
      if (a?.is_active && !b?.is_active) return -1;
      if (!a?.is_active && b?.is_active) return 1;
      return 0;
    });

  return (
    <>
      <div className="divide-y-[0.5px] divide-subtle overflow-scroll">
        {searchedMemberIds?.length !== 0 && (
          <WorkspaceMembersListItem memberDetails={memberDetails ?? []} workspaceSlug={workspaceSlug} />
        )}
        {searchedInvitationsIds?.length === 0 && searchedMemberIds?.length === 0 && (
          <h4 className="mt-16 text-center text-body-xs-regular text-placeholder">{t("no_matching_members")}</h4>
        )}
      </div>
      {isAdmin && searchedInvitationsIds && searchedInvitationsIds.length > 0 && (
        <Collapsible open={showPendingInvites} onOpenChange={setShowPendingInvites}>
          <CollapsibleTrigger className="w-full">
            <div className="flex w-full items-center justify-between pt-4">
              <div className="flex">
                <h4 className="text-h5-medium pt-2 pb-2">{t("workspace_settings.settings.members.pending_invites")}</h4>
                {searchedInvitationsIds && (
                  <CountChip count={searchedInvitationsIds.length} className="h-5  m-auto ml-2" />
                )}
              </div>{" "}
              <ChevronDownIcon className={`h-5 w-5 transition-all ${showPendingInvites ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-col items-center gap-1.5 rounded-md bg-surface-1 py-1.5">
              {searchedInvitationsIds?.map((invitationId) => (
                <WorkspaceInvitationsListItem key={invitationId} invitationId={invitationId} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </>
  );
});
