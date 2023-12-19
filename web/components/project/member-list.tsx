import { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectMemberListItem, SendProjectInvitationModal } from "components/project";
// ui
import { Button, Loader } from "@plane/ui";
// icons
import { Search } from "lucide-react";

export const ProjectMemberList: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const {
    projectMember: { projectMembers, fetchProjectMembers },
    trackEvent: { setTrackElement },
  } = useMobxStore();

  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchedMembers = (projectMembers ?? []).filter((member) => {
    const fullName = `${member.member.first_name} ${member.member.last_name}`.toLowerCase();
    const displayName = member.member.display_name.toLowerCase();

    return displayName.includes(searchQuery.toLowerCase()) || fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <SendProjectInvitationModal
        isOpen={inviteModal}
        members={projectMembers ?? []}
        onClose={() => setInviteModal(false)}
        onSuccess={() => {
          mutate(`PROJECT_INVITATIONS_${projectId?.toString()}`);
          fetchProjectMembers(workspaceSlug?.toString()!, projectId?.toString()!);
        }}
      />

      <div className="flex items-center justify-between gap-4 border-b border-custom-border-100 py-3.5">
        <h4 className="text-xl font-medium">Members</h4>
        <div className="ml-auto flex items-center justify-start gap-1 rounded-md border border-custom-border-200 bg-custom-background-100 px-2.5 py-1.5 text-custom-text-400">
          <Search className="h-3.5 w-3.5" />
          <input
            className="w-full max-w-[234px] border-none bg-transparent text-sm focus:outline-none"
            placeholder="Search"
            value={searchQuery}
            autoFocus
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setTrackElement("PROJECT_SETTINGS_MEMBERS_PAGE_HEADER");
            setInviteModal(true);
          }}
        >
          Add Member
        </Button>
      </div>
      {!projectMembers ? (
        <Loader className="space-y-5">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      ) : (
        <div className="divide-y divide-custom-border-100">
          {projectMembers.length > 0
            ? searchedMembers.map((member) => <ProjectMemberListItem key={member.id} member={member} />)
            : null}
          {searchedMembers.length === 0 && (
            <h4 className="text-md mt-20 text-center text-custom-text-400">No matching member</h4>
          )}
        </div>
      )}
    </>
  );
});
