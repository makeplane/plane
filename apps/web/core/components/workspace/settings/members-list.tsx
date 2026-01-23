import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Disclosure } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import { Collapsible } from "@plane/ui";
// components
import { CountChip } from "@/components/common/count-chip";
import { MembersSettingsLoader } from "@/components/ui/loader/settings/members";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { WorkspaceInvitationsListItem } from "./invitations-list-item";
import { WorkspaceMembersListItem } from "./members-list-item";

export const WorkspaceMembersList = observer(function WorkspaceMembersList(props: {
  searchQuery: string;
  isAdmin: boolean;
}) {
  const { searchQuery, isAdmin } = props;
  const [showPendingInvites, setShowPendingInvites] = useState<boolean>(true);

  // router
  const { workspaceSlug } = useParams();
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
  useSWR(
    workspaceSlug ? `WORKSPACE_MEMBERS_AND_MEMBER_INVITATIONS_${workspaceSlug.toString()}` : null,
    workspaceSlug
      ? async () => {
          await fetchWorkspaceMemberInvitations(workspaceSlug.toString());
          await fetchWorkspaceMembers(workspaceSlug.toString());
        }
      : null
  );

  if (!workspaceMemberIds && !workspaceMemberInvitationIds) return <MembersSettingsLoader />;

  // derived values
  const filteredMemberIds = workspaceSlug ? getFilteredWorkspaceMemberIds(workspaceSlug.toString()) : [];
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
        {searchedMemberIds?.length !== 0 && <WorkspaceMembersListItem memberDetails={memberDetails ?? []} />}
        {searchedInvitationsIds?.length === 0 && searchedMemberIds?.length === 0 && (
          <h4 className="mt-16 text-center text-body-xs-regular text-placeholder">{t("no_matching_members")}</h4>
        )}
      </div>
      {isAdmin && searchedInvitationsIds && searchedInvitationsIds.length > 0 && (
        <Collapsible
          isOpen={showPendingInvites}
          onToggle={() => setShowPendingInvites((prev) => !prev)}
          buttonClassName="w-full"
          className=""
          title={
            <div className="flex w-full items-center justify-between pt-4">
              <div className="flex">
                <h4 className="text-h5-medium pt-2 pb-2">{t("workspace_settings.settings.members.pending_invites")}</h4>
                {searchedInvitationsIds && (
                  <CountChip count={searchedInvitationsIds.length} className="h-5  m-auto ml-2" />
                )}
              </div>{" "}
              <ChevronDownIcon className={`h-5 w-5 transition-all ${showPendingInvites ? "rotate-180" : ""}`} />
            </div>
          }
        >
          <Disclosure.Panel>
            <div className="ml-auto items-center gap-1.5 rounded-md bg-surface-1 py-1.5">
              {searchedInvitationsIds?.map((invitationId) => (
                <WorkspaceInvitationsListItem key={invitationId} invitationId={invitationId} />
              ))}
            </div>
          </Disclosure.Panel>
        </Collapsible>
      )}
    </>
  );
});
