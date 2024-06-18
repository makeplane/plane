"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
// hooks
// components
import { Button } from "@plane/ui";
import { ProjectMemberListItem, SendProjectInvitationModal } from "@/components/project";
// ui
import { MembersSettingsLoader } from "@/components/ui";
import { useEventTracker, useMember } from "@/hooks/store";

export const ProjectMemberList: React.FC = observer(() => {
  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // store hooks
  const { setTrackElement } = useEventTracker();
  const {
    project: { projectMemberIds, getProjectMemberDetails },
  } = useMember();

  const searchedMembers = (projectMemberIds ?? []).filter((userId) => {
    const memberDetails = getProjectMemberDetails(userId);

    if (!memberDetails?.member) return false;

    const fullName = `${memberDetails?.member.first_name} ${memberDetails?.member.last_name}`.toLowerCase();
    const displayName = memberDetails?.member.display_name.toLowerCase();

    return displayName?.includes(searchQuery.toLowerCase()) || fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <SendProjectInvitationModal isOpen={inviteModal} onClose={() => setInviteModal(false)} />

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
          Add member
        </Button>
      </div>
      {!projectMemberIds ? (
        <MembersSettingsLoader />
      ) : (
        <div className="divide-y divide-custom-border-100">
          {projectMemberIds.length > 0
            ? searchedMembers.map((userId) => <ProjectMemberListItem key={userId} userId={userId} />)
            : null}
          {searchedMembers.length === 0 && (
            <h4 className="text-sm mt-16 text-center text-custom-text-400">No matching members</h4>
          )}
        </div>
      )}
    </>
  );
});
