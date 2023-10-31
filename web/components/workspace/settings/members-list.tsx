import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { WorkspaceService } from "services/workspace.service";
// components
import { WorkspaceMembersListItem } from "components/workspace";
// ui
import { Loader } from "@plane/ui";

const workspaceService = new WorkspaceService();

export const WorkspaceMembersList: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { workspace: workspaceStore, user: userStore } = useMobxStore();

  const workspaceMembers = workspaceStore.workspaceMembers;
  const user = userStore.workspaceMemberInfo;

  const { data: workspaceInvitations } = useSWR(
    workspaceSlug ? `WORKSPACE_INVITATIONS_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => workspaceService.workspaceInvitations(workspaceSlug.toString()) : null
  );

  const members = [
    ...(workspaceInvitations?.map((item) => ({
      id: item.id,
      memberId: item.id,
      avatar: "",
      first_name: item.email,
      last_name: "",
      email: item.email,
      display_name: item.email,
      role: item.role,
      status: item.accepted,
      member: false,
      accountCreated: item.accepted,
    })) || []),
    ...(workspaceMembers?.map((item) => ({
      id: item.id,
      memberId: item.member?.id,
      avatar: item.member?.avatar,
      first_name: item.member?.first_name,
      last_name: item.member?.last_name,
      email: item.member?.email,
      display_name: item.member?.display_name,
      role: item.role,
      status: true,
      member: true,
      accountCreated: true,
    })) || []),
  ];

  if (!workspaceMembers || !workspaceInvitations || !user)
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
      {members.length > 0
        ? members.map((member) => <WorkspaceMembersListItem key={member.id} member={member} />)
        : null}
    </div>
  );
});
