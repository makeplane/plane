import { useState } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { ProjectInvitationService } from "services/project";
// hooks
import useUser from "hooks/use-user";
// components
import { ProjectMemberListItem, SendProjectInvitationModal } from "components/project";
// ui
import { Button, Loader } from "@plane/ui";
// icons
import { Search } from "lucide-react";

// services
const projectInvitationService = new ProjectInvitationService();

export const ProjectMemberList: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const { project: projectStore } = useMobxStore();

  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { user } = useUser();

  const { data: projectInvitations } = useSWR(
    workspaceSlug && projectId ? `PROJECT_INVITATIONS_${projectId.toString()}` : null,
    workspaceSlug && projectId
      ? () => projectInvitationService.fetchProjectInvitations(workspaceSlug.toString(), projectId.toString())
      : null
  );

  // derived values
  const projectMembers = projectStore.projectMembers;

  const members = [
    ...(projectMembers?.map((item) => ({
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
    })) || []),
    ...(projectInvitations?.map((item: any) => ({
      id: item.id,
      memberId: item.id,
      avatar: item.avatar ?? "",
      first_name: item.first_name ?? item.email,
      last_name: item.last_name ?? "",
      email: item.email,
      display_name: item.email,
      role: item.role,
      status: item.accepted,
      member: false,
    })) || []),
  ];

  const searchedMembers = members?.filter((member) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const displayName = member.display_name.toLowerCase();
    return displayName.includes(searchQuery.toLowerCase()) || fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <SendProjectInvitationModal
        isOpen={inviteModal}
        setIsOpen={setInviteModal}
        members={members}
        user={user}
        onSuccess={() => {
          mutate(`PROJECT_INVITATIONS_${projectId?.toString()}`);
          projectStore.fetchProjectMembers(workspaceSlug?.toString()!, projectId?.toString()!);
        }}
      />

      <div className="flex items-center justify-between gap-4 py-3.5 border-b border-custom-border-200">
        <h4 className="text-xl font-medium">Members</h4>
        <div className="flex gap-1 items-center justify-start ml-auto text-custom-text-400 rounded-md px-2.5 py-1.5 border border-custom-border-200 bg-custom-background-100">
          <Search className="h-3.5 w-3.5" />
          <input
            className="max-w-[234px] w-full border-none bg-transparent text-sm focus:outline-none"
            placeholder="Search"
            value={searchQuery}
            autoFocus={true}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => setInviteModal(true)}>
          Add Member
        </Button>
      </div>
      {!projectMembers || !projectInvitations ? (
        <Loader className="space-y-5">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      ) : (
        <div className="divide-y divide-custom-border-200">
          {members.length > 0
            ? searchedMembers.map((member) => <ProjectMemberListItem key={member.id} member={member} />)
            : null}
          {searchedMembers.length === 0 && (
            <h4 className="text-md text-custom-text-400 text-center mt-20">No matching member</h4>
          )}
        </div>
      )}
    </>
  );
});
