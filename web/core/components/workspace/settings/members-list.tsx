import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
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
