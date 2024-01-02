import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useMember } from "hooks/store";
// components
import { WorkspaceInvitationsListItem, WorkspaceMembersListItem } from "components/workspace";
// ui
import { Loader } from "@plane/ui";

export const WorkspaceMembersList: FC<{ searchQuery: string }> = observer((props) => {
  const { searchQuery } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    workspace: {
      fetchWorkspaceMemberInvitations,
      workspaceMemberIds,
      getSearchedWorkspaceMemberIds,
      workspaceMemberInvitationIds,
      getSearchedWorkspaceInvitationIds,
    },
  } = useMember();
  // fetching workspace invitations
  useSWR(
    workspaceSlug ? `WORKSPACE_INVITATIONS_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => fetchWorkspaceMemberInvitations(workspaceSlug.toString()) : null
  );

  if (!workspaceMemberIds && !workspaceMemberInvitationIds)
    return (
      <Loader className="space-y-5">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  // derived values
  const searchedMemberIds = getSearchedWorkspaceMemberIds(searchQuery);
  const searchedInvitationsIds = getSearchedWorkspaceInvitationIds(searchQuery);

  return (
    <div className="divide-y-[0.5px] divide-custom-border-100">
      {searchedInvitationsIds && searchedInvitationsIds.length > 0
        ? searchedInvitationsIds?.map((invitationId) => (
            <WorkspaceInvitationsListItem key={invitationId} invitationId={invitationId} />
          ))
        : null}
      {searchedMemberIds && searchedMemberIds.length > 0
        ? searchedMemberIds?.map((memberId) => <WorkspaceMembersListItem key={memberId} memberId={memberId} />)
        : null}
      {searchedInvitationsIds?.length === 0 && searchedMemberIds?.length === 0 && (
        <h4 className="mt-16 text-center text-sm text-custom-text-400">No matching members</h4>
      )}
    </div>
  );
});
