"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
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
import { useEventTracker, useMember, useUser, useWorkspace } from "@/hooks/store";
// services
import { UpdateWorkspaceSeatsModal } from "@/plane-web/components/workspace";
import selfHostedSubscriptionService from "@/plane-web/services/self-hosted-subscription.service";

const WorkspaceMembersSettingsPage = observer(() => {
  // states
  const [inviteModal, setInviteModal] = useState(false);
  const [updateWorkspaceSeatsModal, setUpdateWorkspaceSeatsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { captureEvent } = useEventTracker();
  const {
    canPerformWorkspaceAdminActions,
    canPerformWorkspaceViewerActions,
    canPerformWorkspaceMemberActions,
    membership: { currentWorkspaceRole },
  } = useUser();
  const {
    workspace: { inviteMembersToWorkspace },
  } = useMember();
  const { currentWorkspace } = useWorkspace();
  // swr
  const { data: memberInviteCheckData } = useSWR(
    workspaceSlug ? `SELF_HOSTED_MEMBER_INVITE_CHECK_${workspaceSlug}` : null,
    () => (workspaceSlug ? selfHostedSubscriptionService.memberInviteCheck(workspaceSlug?.toString()) : null)
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
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Members` : undefined;

  // if user is not authorized to view this page
  if (currentWorkspaceRole && !canPerformWorkspaceViewerActions) {
    return <NotAuthorizedView section="settings" />;
  }

  if (!memberInviteCheckData) return null;

  const handleAddMember = () => {
    if (memberInviteCheckData?.invite_allowed) {
      setInviteModal(true);
    } else {
      setUpdateWorkspaceSeatsModal(true);
    }
  };

  return (
    <>
      <PageHead title={pageTitle} />
      <SendWorkspaceInvitationModal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        onSubmit={handleWorkspaceInvite}
      />
      <UpdateWorkspaceSeatsModal
        isOpen={updateWorkspaceSeatsModal}
        onClose={() => setUpdateWorkspaceSeatsModal(false)}
      />
      <section
        className={cn("w-full overflow-y-auto md:pr-9 pr-4", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <div className="flex items-center justify-between gap-4 py-3.5">
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
            <Button variant="primary" size="sm" onClick={() => setUpdateWorkspaceSeatsModal(true)}>
              Add seats
            </Button>
          )}
          {canPerformWorkspaceAdminActions && (
            <Button variant="primary" size="sm" onClick={handleAddMember}>
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
