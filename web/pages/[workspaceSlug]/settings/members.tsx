import { useState, ReactElement } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Search } from "lucide-react";
// hooks
import { useApplication, useMember, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { SendWorkspaceInvitationModal, WorkspaceMembersList } from "components/workspace";
// ui
import { Button } from "@plane/ui";
// types
import { NextPageWithLayout } from "lib/types";
import { IWorkspaceBulkInviteFormData } from "@plane/types";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

const WorkspaceMembersSettingsPage: NextPageWithLayout = observer(() => {
  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    eventTracker: { postHogEventTracker, setTrackElement },
  } = useApplication();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const {
    workspace: { inviteMembersToWorkspace },
  } = useMember();
  // toast alert
  const { setToastAlert } = useToast();

  const handleWorkspaceInvite = (data: IWorkspaceBulkInviteFormData) => {
    if (!workspaceSlug) return;

    return inviteMembersToWorkspace(workspaceSlug.toString(), data)
      .then(() => {
        setInviteModal(false);
        postHogEventTracker("MEMBER_INVITED", { state: "SUCCESS" });
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Invitations sent successfully.",
        });
      })
      .catch((err) => {
        postHogEventTracker("MEMBER_INVITED", { state: "FAILED" });
        setToastAlert({
          type: "error",
          title: "Error!",
          message: `${err.error ?? "Something went wrong. Please try again."}`,
        });
      });
  };

  const hasAddMemberPermission =
    currentWorkspaceRole && [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER].includes(currentWorkspaceRole);

  return (
    <>
      <SendWorkspaceInvitationModal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        onSubmit={handleWorkspaceInvite}
      />
      <section className="w-full overflow-y-auto py-8 pr-9">
        <div className="flex items-center justify-between gap-4 border-b border-custom-border-100 py-3.5">
          <h4 className="text-xl font-medium">Members</h4>
          <div className="ml-auto flex items-center gap-1.5 rounded-md border border-custom-border-200 bg-custom-background-100 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-custom-text-400" />
            <input
              className="w-full max-w-[234px] border-none bg-transparent text-sm outline-none placeholder:text-custom-text-400"
              placeholder="Search..."
              value={searchQuery}
              autoFocus
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {hasAddMemberPermission && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setTrackElement("WORKSPACE_SETTINGS_MEMBERS_PAGE_HEADER");
                setInviteModal(true);
              }}
            >
              Add member
            </Button>
          )}
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
