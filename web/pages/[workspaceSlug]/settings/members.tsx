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
// helpers
import { trackEvent } from "helpers/event-tracker.helper";
// types
import { NextPageWithLayout } from "types/app";
import { IWorkspaceBulkInviteFormData } from "types";

const WorkspaceMembersSettingsPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const {
    workspaceMember: { inviteMembersToWorkspace },
    trackEvent: { postHogEventTracker, setTrackElement }
  } = useMobxStore();
  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // hooks
  const { setToastAlert } = useToast();

  const handleWorkspaceInvite = (data: IWorkspaceBulkInviteFormData) => {
    if (!workspaceSlug) return;

    return inviteMembersToWorkspace(workspaceSlug.toString(), data)
      .then(async (res) => {
        setInviteModal(false);
        postHogEventTracker("WORKSPACE_USER_INVITE", { ...res, state: "SUCCESS" });
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Invitations sent successfully.",
        });
      })
      .catch((err) => {
        postHogEventTracker("WORKSPACE_USER_INVITE", { state: "FAILED" });
        setToastAlert({
          type: "error",
          title: "Error!",
          message: `${err.error ?? "Something went wrong. Please try again."}`,
        });
      });
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
          <div className="flex items-center gap-1.5 ml-auto rounded-md px-2.5 py-1.5 border border-custom-border-200 bg-custom-background-100">
            <Search className="h-3.5 w-3.5 text-custom-text-400" />
            <input
              className="max-w-[234px] w-full border-none bg-transparent text-sm outline-none placeholder:text-custom-text-400"
              placeholder="Search..."
              value={searchQuery}
              autoFocus
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="primary" size="sm" onClick={() => {
            setTrackElement("WORKSPACE_SETTINGS_MEMBERS_PAGE_HEADER");
            setInviteModal(true)
          }
          }>
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
