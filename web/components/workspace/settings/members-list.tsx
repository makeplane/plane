import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { WorkspaceMembersListItem } from "components/workspace";
// ui
import { Loader } from "@plane/ui";

export const WorkspaceMembersList: FC<{ searchQuery: string }> = observer(({ searchQuery }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const {
    workspaceMember: {
      workspaceMembers,
      workspaceMembersWithInvitations,
      workspaceMemberInvitations,
      fetchWorkspaceMemberInvitations,
    },
    user: { currentWorkspaceMemberInfo },
  } = useMobxStore();
  // fetching workspace invitations
  useSWR(
    workspaceSlug ? `WORKSPACE_INVITATIONS_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => fetchWorkspaceMemberInvitations(workspaceSlug.toString()) : null
  );

  const searchedMembers = workspaceMembersWithInvitations?.filter((member: any) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const displayName = member.display_name.toLowerCase();
    return displayName.includes(searchQuery.toLowerCase()) || fullName.includes(searchQuery.toLowerCase());
  });

  if (
    !workspaceMembers ||
    !workspaceMemberInvitations ||
    !workspaceMembersWithInvitations ||
    !currentWorkspaceMemberInfo
  )
    return (
      <Loader className="space-y-5">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  return (
    <div className="divide-y-[0.5px] divide-custom-border-200">
      {workspaceMembersWithInvitations.length > 0
        ? searchedMembers?.map((member) => <WorkspaceMembersListItem key={member.id} member={member} />)
        : null}
      {searchedMembers?.length === 0 && (
        <h4 className="text-md text-custom-text-400 text-center mt-20">No matching member</h4>
      )}
    </div>
  );
});
