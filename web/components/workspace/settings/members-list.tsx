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

export const WorkspaceMembersList: FC<{ searchQuery: string }> = observer((props) => {
  const { searchQuery } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const {
    workspaceMember: { workspaceMembersWithInvitations, fetchWorkspaceMemberInvitations },
  } = useMobxStore();
  // fetching workspace invitations
  useSWR(
    workspaceSlug ? `WORKSPACE_INVITATIONS_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => fetchWorkspaceMemberInvitations(workspaceSlug.toString()) : null
  );

  const searchedMembers = workspaceMembersWithInvitations?.filter((member: any) => {
    const email = member.email?.toLowerCase();
    const displayName = member.display_name.toLowerCase();
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();

    return `${email}${displayName}${fullName}`.includes(searchQuery.toLowerCase());
  });

  if (!workspaceMembersWithInvitations)
    return (
      <Loader className="space-y-5">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  return (
    <div className="divide-y-[0.5px] divide-custom-border-100">
      {workspaceMembersWithInvitations.length > 0
        ? searchedMembers?.map((member) => <WorkspaceMembersListItem key={member.id} member={member} />)
        : null}
      {searchedMembers?.length === 0 && (
        <h4 className="text-sm text-custom-text-400 text-center mt-16">No matching members</h4>
      )}
    </div>
  );
});
