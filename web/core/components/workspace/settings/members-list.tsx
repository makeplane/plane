import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { ChevronDown } from "lucide-react";
import { Disclosure } from "@headlessui/react";
import { Collapsible } from "@plane/ui";
import { CountChip } from "@/components/common";
import { MembersSettingsLoader } from "@/components/ui";
import { WorkspaceInvitationsListItem, WorkspaceMembersListItem } from "@/components/workspace";
// hooks
import { useMember } from "@/hooks/store";

export const WorkspaceMembersList: FC<{ searchQuery: string; isAdmin: boolean }> = observer((props) => {
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
      getSearchedWorkspaceMemberIds,
      workspaceMemberInvitationIds,
      getSearchedWorkspaceInvitationIds,
      getWorkspaceMemberDetails,
    },
  } = useMember();
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
  const searchedMemberIds = getSearchedWorkspaceMemberIds(searchQuery);
  const searchedInvitationsIds = getSearchedWorkspaceInvitationIds(searchQuery);
  const memberDetails = searchedMemberIds?.map((memberId) => getWorkspaceMemberDetails(memberId));

  return (
    <>
      <div className="divide-y-[0.5px] divide-custom-border-100 overflow-scroll	">
        {searchedMemberIds?.length !== 0 && <WorkspaceMembersListItem memberDetails={memberDetails ?? []} />}
        {searchedInvitationsIds?.length === 0 && searchedMemberIds?.length === 0 && (
          <h4 className="mt-16 text-center text-sm text-custom-text-400">No matching members</h4>
        )}
      </div>
      {isAdmin && searchedInvitationsIds && searchedInvitationsIds.length > 0 && (
        <Collapsible
          isOpen={showPendingInvites}
          onToggle={() => setShowPendingInvites((prev) => !prev)}
          buttonClassName="w-full"
          title={
            <div className="flex w-full items-center justify-between pt-4">
              <div className="flex">
                <h4 className="text-xl font-medium pt-2 pb-2">Pending invites</h4>
                {searchedInvitationsIds && (
                  <CountChip count={searchedInvitationsIds.length} className="h-5  m-auto ml-2" />
                )}
              </div>{" "}
              <ChevronDown className={`h-5 w-5 transition-all ${showPendingInvites ? "rotate-180" : ""}`} />
            </div>
          }
        >
          <Disclosure.Panel>
            <div className="ml-auto  items-center gap-1.5 rounded-md bg-custom-background-100  py-1.5">
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
