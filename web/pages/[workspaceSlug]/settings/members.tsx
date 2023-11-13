import { useState, ReactElement } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { SendWorkspaceInvitationModal, WorkspaceMembersList } from "components/workspace";
// ui
import { Button } from "@plane/ui";
// icons
import { Search } from "lucide-react";
// types
import { NextPageWithLayout } from "types/app";
import { IWorkspaceBulkInviteFormData } from "types";

const WorkspaceMembersSettingsPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const {
    workspaceMember: { inviteMembersToWorkspace },
  } = useMobxStore();
  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // hooks
  const { setToastAlert } = useToast();

  const handleWorkspaceInvite = (data: IWorkspaceBulkInviteFormData) => {
    if (!workspaceSlug) return;

    return inviteMembersToWorkspace(workspaceSlug.toString(), data)
      .then(async () => {
        setInviteModal(false);
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Invitations sent successfully.",
        });
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: `${err.error ?? "Something went wrong. Please try again."}`,
        })
      );
  };

  return (
    <>
      {workspaceSlug && (
        <SendWorkspaceInvitationModal
          isOpen={inviteModal}
          onClose={() => setInviteModal(false)}
          onSubmit={handleWorkspaceInvite}
        />
      )}
      <section className="pr-9 py-8 w-full overflow-y-auto">
        <div className="flex items-center justify-between gap-4 py-3.5 border-b border-custom-border-100">
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
    </>
  );
});

WorkspaceMembersSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Members Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WorkspaceMembersSettingsPage;
