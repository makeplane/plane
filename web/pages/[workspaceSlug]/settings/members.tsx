import { useState, ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Search } from "lucide-react";
import { IWorkspaceBulkInviteFormData } from "@plane/types";
// hooks
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
import { PageHead } from "@/components/core";
import { WorkspaceSettingHeader } from "@/components/headers";
import { SendWorkspaceInvitationModal, WorkspaceMembersList } from "@/components/workspace";
import { MEMBER_INVITED } from "@/constants/event-tracker";
import { EUserWorkspaceRoles } from "@/constants/workspace";
import { getUserRole } from "@/helpers/user.helper";
import { useEventTracker, useMember, useUser, useWorkspace } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
import { WorkspaceSettingLayout } from "@/layouts/settings-layout";
// components
// ui
// types
import { NextPageWithLayout } from "@/lib/types";
// helpers
// constants

const WorkspaceMembersSettingsPage: NextPageWithLayout = observer(() => {
  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { captureEvent } = useEventTracker();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const {
    workspace: { inviteMembersToWorkspace },
  } = useMember();
  const { currentWorkspace } = useWorkspace();

  const handleWorkspaceInvite = (data: IWorkspaceBulkInviteFormData) => {
    if (!workspaceSlug) return;

    return inviteMembersToWorkspace(workspaceSlug.toString(), data)
      .then(() => {
        setInviteModal(false);
        captureEvent(MEMBER_INVITED, {
          emails: [
            ...data.emails.map((email) => ({
              email: email.email,
              role: getUserRole(email.role),
            })),
          ],
          project_id: undefined,
          state: "SUCCESS",
          element: "Workspace settings member page",
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Invitations sent successfully.",
        });
      })
      .catch((err) => {
        captureEvent(MEMBER_INVITED, {
          emails: [
            ...data.emails.map((email) => ({
              email: email.email,
              role: getUserRole(email.role),
            })),
          ],
          project_id: undefined,
          state: "FAILED",
          element: "Workspace settings member page",
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: `${err.error ?? "Something went wrong. Please try again."}`,
        });
      });
  };

  // derived values
  const hasAddMemberPermission =
    currentWorkspaceRole && [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER].includes(currentWorkspaceRole);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Members` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <SendWorkspaceInvitationModal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        onSubmit={handleWorkspaceInvite}
      />
      <section className="w-full overflow-y-auto md:pr-9 pr-4">
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
            <Button variant="primary" size="sm" onClick={() => setInviteModal(true)}>
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
