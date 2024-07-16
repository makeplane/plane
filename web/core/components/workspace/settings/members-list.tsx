import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { ChevronDown } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { CountChip } from "@/components/common";
import { MembersSettingsLoader } from "@/components/ui";
import { WorkspaceInvitationsListItem, WorkspaceMembersListItem } from "@/components/workspace";
// hooks
import { useMember } from "@/hooks/store";

export const WorkspaceMembersList: FC<{ searchQuery: string }> = observer((props) => {
  const { searchQuery } = props;
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
        <WorkspaceMembersListItem memberDetails={memberDetails ?? []} />
        {searchedInvitationsIds?.length === 0 && searchedMemberIds?.length === 0 && (
          <h4 className="mt-16 text-center text-sm text-custom-text-400">No matching members</h4>
        )}
      </div>
      <Disclosure as="div" className="border-t border-custom-border-100  pt-6 overscroll-x-hidden	">
        {({ open }) => (
          <>
            <Disclosure.Button as="button" type="button" className="flex w-full items-center justify-between py-4">
              <div className="flex">
                <h4 className="text-xl font-medium pt-2 pb-2">Pending invites</h4>
                {/* <div className="w-5 flex justify-center bg-">{searchedInvitationsIds && searchedInvitationsIds.length}</div> */}
                {searchedInvitationsIds && (
                  <CountChip count={searchedInvitationsIds.length} className="h-5  m-auto ml-2" />
                )}
              </div>{" "}
              <ChevronDown className={`h-5 w-5 transition-all ${open ? "rotate-180" : ""}`} />
            </Disclosure.Button>
            <Transition
              show={open}
              enter="transition duration-100 ease-out"
              enterFrom="transform opacity-0"
              enterTo="transform opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform opacity-100"
              leaveTo="transform opacity-0"
            >
              <Disclosure.Panel>
                <div className="ml-auto  items-center gap-1.5 rounded-md bg-custom-background-100  py-1.5">
                  {searchedInvitationsIds && searchedInvitationsIds.length > 0
                    ? searchedInvitationsIds?.map((invitationId) => (
                        <WorkspaceInvitationsListItem key={invitationId} invitationId={invitationId} />
                      ))
                    : null}
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
    </>
  );
});
