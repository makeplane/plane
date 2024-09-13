"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
// types
import { IWorkspaceBulkInviteFormData } from "@plane/types";
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { SendWorkspaceInvitationModal, WorkspaceMembersList } from "@/components/workspace";
// constants
import { MEMBER_INVITED } from "@/constants/event-tracker";
// helpers
import { cn } from "@/helpers/common.helper";
import { getUserRole } from "@/helpers/user.helper";
// hooks
import { useEventTracker, useMember, useUserPermissions, useWorkspace } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const WorkspaceMembersSettingsPage = observer(() => {
  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { captureEvent } = useEventTracker();
  const {
    workspace: { inviteMembersToWorkspace },
  } = useMember();
  const { currentWorkspace } = useWorkspace();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const handleWorkspaceInvite = (data: IWorkspaceBulkInviteFormData) => {
    if (!workspaceSlug) return;

    return inviteMembersToWorkspace(workspaceSlug.toString(), data)
      .then(() => {
        setInviteModal(false);
        captureEvent(MEMBER_INVITED, {
          emails: [
            ...data.emails.map((email) => ({
              email: email.email,
              role: getUserRole(email.role as unknown as EUserPermissions),
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
              role: getUserRole(email.role as unknown as EUserPermissions),
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
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Members` : undefined;

  // if user is not authorized to view this page
  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <SendWorkspaceInvitationModal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        onSubmit={handleWorkspaceInvite}
      />
      <section
        className={cn("w-full overflow-y-auto", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <div className="flex justify-between gap-4 pb-3.5 items-start	">
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
          {canPerformWorkspaceAdminActions && (
            <Button variant="primary" size="sm" onClick={() => setInviteModal(true)}>
              Add member
            </Button>
          )}
        </div>
        <WorkspaceMembersList searchQuery={searchQuery} isAdmin={canPerformWorkspaceAdminActions} />
      </section>
    </>
  );
});

export default WorkspaceMembersSettingsPage;
