import { useState } from "react";
import { useRouter } from "next/router";
// hooks
import useUser from "hooks/use-user";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { SendWorkspaceInvitationModal, WorkspaceMembersList } from "components/workspace";
// ui
import { Button } from "@plane/ui";
// types
import type { NextPage } from "next";
import { Search } from "lucide-react";

const MembersSettings: NextPage = () => {
  const [inviteModal, setInviteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { user } = useUser();

  return (
    <AppLayout header={<WorkspaceSettingHeader title="Members Settings" />}>
      <WorkspaceSettingLayout>
        {workspaceSlug && (
          <SendWorkspaceInvitationModal
            isOpen={inviteModal}
            onClose={() => setInviteModal(false)}
            workspaceSlug={workspaceSlug.toString()}
            user={user}
          />
        )}
        <section className="pr-9 py-8 w-full overflow-y-auto">
          <div className="flex items-center justify-between gap-4 py-3.5 border-b-[0.5px] border-custom-border-200">
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
            <Button variant="primary" size="sm" onClick={() => setInviteModal(true)}>
              Add Member
            </Button>
          </div>
          <WorkspaceMembersList searchQuery={searchQuery} />
        </section>
      </WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default MembersSettings;
