/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import { ROLE } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import type { IWorkspaceMemberInvitation } from "@plane/types";
import { Checkbox } from "@makeplane/propel/components/checkbox";
import { cn, truncateText } from "@plane/utils";
// constants
import { WorkspaceLogo } from "@/components/workspace/logo";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserSettings } from "@/hooks/store/user";
// services
import { WorkspaceService } from "@/services/workspace.service";
// local components
import { CommonOnboardingHeader } from "../common";

type Props = {
  invitations: IWorkspaceMemberInvitation[];
  handleNextStep: () => Promise<void>;
  handleCurrentViewChange: () => void;
};
const workspaceService = new WorkspaceService();

export function WorkspaceJoinInvitesStep(props: Props) {
  const { invitations, handleNextStep, handleCurrentViewChange } = props;
  // states
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);
  // store hooks
  const { fetchWorkspaces } = useWorkspace();
  const { fetchCurrentUserSettings } = useUserSettings();

  // handle invitation
  const handleInvitation = (workspace_invitation: IWorkspaceMemberInvitation, action: "accepted" | "withdraw") => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => [...prevData, workspace_invitation.id]);
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) => prevData.filter((item: string) => item !== workspace_invitation.id));
    }
  };

  // submit invitations
  const submitInvitations = async () => {
    const invitation = invitations?.find((invitation) => invitation.id === invitationsRespond[0]);

    if (invitationsRespond.length <= 0 && !invitation?.role) return;

    setIsJoiningWorkspaces(true);

    try {
      await workspaceService.joinWorkspaces({ invitations: invitationsRespond });
      await fetchWorkspaces();
      await fetchCurrentUserSettings();
      await handleNextStep();
    } catch (error: any) {
      console.error(error);
      setIsJoiningWorkspaces(false);
    }
  };

  return invitations && invitations.length > 0 ? (
    <div className="flex flex-col gap-10">
      <CommonOnboardingHeader title="Join invites or create a workspace" description="All your work — unified." />
      <div className="flex flex-col gap-3">
        {invitations &&
          invitations.length > 0 &&
          invitations.map((invitation) => {
            const isSelected = invitationsRespond.includes(invitation.id);
            const invitedWorkspace = invitation.workspace;
            return (
              <label
                key={invitation.id}
                htmlFor={`workspace-invitation-${invitation.id}`}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-strong has-[:focus-visible]:ring-offset-2",
                  isSelected
                    ? "border-accent-strong bg-accent-subtle"
                    : "border-subtle bg-layer-2 hover:bg-layer-2-hover"
                )}
              >
                <span className="flex shrink-0">
                  <Checkbox
                    id={`workspace-invitation-${invitation.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleInvitation(invitation, checked ? "accepted" : "withdraw")}
                    aria-labelledby={`workspace-invitation-${invitation.id}-name`}
                  />
                </span>
                <span aria-hidden="true" className="shrink-0">
                  <WorkspaceLogo
                    logo={invitedWorkspace?.logo_url}
                    name={invitedWorkspace?.name}
                    classNames="size-8 shrink-0 rounded-lg"
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col items-start">
                  <span id={`workspace-invitation-${invitation.id}-name`} className="sr-only">
                    {invitedWorkspace?.name ?? "Select workspace invitation"}
                  </span>
                  <span aria-hidden="true" className="w-full truncate text-body-sm-medium text-primary">
                    {truncateText(invitedWorkspace?.name, 30)}
                  </span>
                  <span className="w-full truncate text-body-xs-regular text-tertiary">{ROLE[invitation.role]}</span>
                </span>
              </label>
            );
          })}
      </div>
      <div className="flex flex-col gap-4">
        <Button
          variant="primary"
          size="lg"
          stretch="full"
          onClick={submitInvitations}
          disabled={isJoiningWorkspaces || !invitationsRespond.length}
          loading={isJoiningWorkspaces}
          label="Continue"
        />
        <Button
          variant="ghost"
          size="lg"
          stretch="full"
          label="Create new workspace"
          onClick={handleCurrentViewChange}
          disabled={isJoiningWorkspaces}
        />
      </div>
    </div>
  ) : (
    <div>No Invitations found</div>
  );
}
