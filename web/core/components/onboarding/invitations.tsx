"use client";

import React, { useState } from "react";
// plane imports
import { ROLE, MEMBER_TRACKER_EVENTS, MEMBER_TRACKER_ELEMENTS } from "@plane/constants";
// types
import { IWorkspaceMemberInvitation } from "@plane/types";
// ui
import { Button, Checkbox, Spinner } from "@plane/ui";
import { truncateText } from "@plane/utils";
// constants
// helpers
import { WorkspaceLogo } from "@/components/workspace/logo";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useUserSettings, useWorkspace } from "@/hooks/store";
// services
import { WorkspaceService } from "@/plane-web/services";

type Props = {
  invitations: IWorkspaceMemberInvitation[];
  handleNextStep: () => Promise<void>;
  handleCurrentViewChange: () => void;
};
const workspaceService = new WorkspaceService();

export const Invitations: React.FC<Props> = (props) => {
  const { invitations, handleNextStep, handleCurrentViewChange } = props;
  // states
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);
  // store hooks
  const { fetchWorkspaces } = useWorkspace();
  const { fetchCurrentUserSettings } = useUserSettings();

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
      captureSuccess({
        eventName: MEMBER_TRACKER_EVENTS.accept,
        payload: {
          member_id: invitation?.id,
        },
      });
      await fetchWorkspaces();
      await fetchCurrentUserSettings();
      await handleNextStep();
    } catch (error: any) {
      console.error(error);
      captureError({
        eventName: MEMBER_TRACKER_EVENTS.accept,
        payload: {
          member_id: invitation?.id,
        },
        error: error,
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
                  <WorkspaceLogo
                    logo={invitedWorkspace?.logo_url}
                    name={invitedWorkspace?.name}
                    classNames="size-9 flex-shrink-0"
                  />
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
        data-ph-element={MEMBER_TRACKER_ELEMENTS.ONBOARDING_JOIN_WORKSPACE}
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
