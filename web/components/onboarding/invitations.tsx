import React, { useState } from "react";
import useSWR from "swr";;
// types
import { IWorkspaceMemberInvitation } from "@plane/types";
// ui
import { Button, Checkbox, Spinner } from "@plane/ui";
// constants
import { MEMBER_ACCEPTED } from "@/constants/event-tracker";
import { USER_WORKSPACE_INVITATIONS } from "@/constants/fetch-keys";
import { ROLE } from "@/constants/workspace";
// helpers
import { truncateText } from "@/helpers/string.helper";
import { getUserRole } from "@/helpers/user.helper";
// hooks
import { useEventTracker, useWorkspace } from "@/hooks/store";
// services
import { WorkspaceService } from "@/services/workspace.service";

type Props = {
  handleNextStep: () => Promise<void>;
  handleCurrentViewChange: () => void;
};
const workspaceService = new WorkspaceService();

export const Invitations: React.FC<Props> = (props) => {
  const { handleNextStep, handleCurrentViewChange } = props;
  // states
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);
  // store hooks
  const { captureEvent } = useEventTracker();
  const { fetchWorkspaces } = useWorkspace();

  const { data: invitations } = useSWR(USER_WORKSPACE_INVITATIONS, () => workspaceService.userWorkspaceInvitations());

  const handleInvitation = (workspace_invitation: IWorkspaceMemberInvitation, action: "accepted" | "withdraw") => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => [...prevData, workspace_invitation.id]);
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) => prevData.filter((item: string) => item !== workspace_invitation.id));
    }
  };

  const submitInvitations = async () => {
    const invitation = invitations?.find((invitation) => invitation.id === invitationsRespond[0]);

    if (invitationsRespond.length <= 0 && !invitation?.role) return;

    setIsJoiningWorkspaces(true);

    try {
      await workspaceService.joinWorkspaces({ invitations: invitationsRespond });
      captureEvent(MEMBER_ACCEPTED, {
        member_id: invitation?.id,
        role: getUserRole(invitation?.role as any),
        project_id: undefined,
        accepted_from: "App",
        state: "SUCCESS",
        element: "Workspace invitations page",
      });
      await fetchWorkspaces();
      await handleNextStep();
    } catch (error) {
      console.error(error);
      captureEvent(MEMBER_ACCEPTED, {
        member_id: invitation?.id,
        role: getUserRole(invitation?.role as any),
        project_id: undefined,
        accepted_from: "App",
        state: "FAILED",
        element: "Workspace invitations page",
      });
      setIsJoiningWorkspaces(false);
    }
  };

  return invitations && invitations.length > 0 ? (
    <div className="space-y-4">
      <div className="text-center space-y-1 py-4 mx-auto">
        <h3 className="text-3xl font-bold text-onboarding-text-100">You are invited!</h3>
        <p className="font-medium text-onboarding-text-400">Accept the invites to collaborate with your team.</p>
      </div>
      <div>
        {invitations &&
          invitations.length > 0 &&
          invitations.map((invitation) => {
            const isSelected = invitationsRespond.includes(invitation.id);
            const invitedWorkspace = invitation.workspace;
            return (
              <div
                key={invitation.id}
                className={`flex cursor-pointer items-center gap-2 rounded border p-3.5 border-custom-border-200 hover:bg-onboarding-background-300/30`}
                onClick={() => handleInvitation(invitation, isSelected ? "withdraw" : "accepted")}
              >
                <div className="flex-shrink-0">
                  <div className="grid h-9 w-9 place-items-center rounded">
                    {invitedWorkspace?.logo && invitedWorkspace.logo !== "" ? (
                      <img
                        src={invitedWorkspace.logo}
                        height="100%"
                        width="100%"
                        className="rounded"
                        alt={invitedWorkspace.name}
                      />
                    ) : (
                      <span className="grid h-9 w-9 place-items-center rounded bg-gray-700 px-3 py-1.5 uppercase text-white">
                        {invitedWorkspace?.name[0]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{truncateText(invitedWorkspace?.name, 30)}</div>
                  <p className="text-xs text-custom-text-200">{ROLE[invitation.role]}</p>
                </div>
                <span className={`flex-shrink-0`}>
                  <Checkbox checked={isSelected} />
                </span>
              </div>
            );
          })}
      </div>
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={submitInvitations}
        disabled={isJoiningWorkspaces || !invitationsRespond.length}
      >
        {isJoiningWorkspaces ? <Spinner height="20px" width="20px" /> : "Continue to workspace"}
      </Button>
      <div className="mx-auto mt-4 flex items-center sm:w-96">
        <hr className="w-full border-onboarding-border-100" />
        <p className="mx-3 flex-shrink-0 text-center text-sm text-onboarding-text-400">or</p>
        <hr className="w-full border-onboarding-border-100" />
      </div>
      <Button
        variant="link-neutral"
        size="lg"
        className="w-full text-base bg-custom-background-90"
        onClick={handleCurrentViewChange}
        disabled={isJoiningWorkspaces}
      >
        Create your own workspace
      </Button>
    </div>
  ) : (
    <div>No Invitations found</div>
  );
};
