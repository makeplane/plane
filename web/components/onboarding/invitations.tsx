import React, { useState } from "react";
import useSWR, { mutate } from "swr";
// hooks
import { useApplication, useUser, useWorkspace } from "hooks/store";
// components
import { Button } from "@plane/ui";
// helpers
import { truncateText } from "helpers/string.helper";
// services
import { WorkspaceService } from "services/workspace.service";
// constants
import { USER_WORKSPACES, USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";
import { ROLE } from "constants/workspace";
// types
import { IWorkspaceMemberInvitation } from "@plane/types";
// icons
import { CheckCircle2, Search } from "lucide-react";

type Props = {
  handleNextStep: () => void;
  setTryDiffAccount: () => void;
};
const workspaceService = new WorkspaceService();

export const Invitations: React.FC<Props> = (props) => {
  const { handleNextStep, setTryDiffAccount } = props;
  // states
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);
  // store hooks
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const { currentUser, updateCurrentUser } = useUser();
  const { workspaces, fetchWorkspaces } = useWorkspace();

  const workspacesList = Object.values(workspaces);

  const { data: invitations, mutate: mutateInvitations } = useSWR(USER_WORKSPACE_INVITATIONS, () =>
    workspaceService.userWorkspaceInvitations()
  );

  const handleInvitation = (workspace_invitation: IWorkspaceMemberInvitation, action: "accepted" | "withdraw") => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => [...prevData, workspace_invitation.id]);
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) => prevData.filter((item: string) => item !== workspace_invitation.id));
    }
  };

  const updateLastWorkspace = async () => {
    if (!workspacesList) return;
    await updateCurrentUser({
      last_workspace_id: workspacesList[0]?.id,
    });
  };

  const submitInvitations = async () => {
    if (invitationsRespond.length <= 0) return;

    setIsJoiningWorkspaces(true);

    await workspaceService
      .joinWorkspaces({ invitations: invitationsRespond })
      .then(async (res) => {
        postHogEventTracker("MEMBER_ACCEPTED", { ...res, state: "SUCCESS", accepted_from: "App" });
        await fetchWorkspaces();
        await mutate(USER_WORKSPACES);
        await updateLastWorkspace();
        await handleNextStep();
        await mutateInvitations();
      })
      .catch((error) => {
        console.error(error);
        postHogEventTracker("MEMBER_ACCEPTED", { state: "FAILED", accepted_from: "App" });
      })
      .finally(() => setIsJoiningWorkspaces(false));
  };

  return invitations && invitations.length > 0 ? (
    <div>
      <div className="space-y-4 md:w-2/3 ">
        <p className="pb-2 text-xl font-semibold sm:text-2xl">Choose a workspace to join </p>
        <div>
          {invitations &&
            invitations.length > 0 &&
            invitations.map((invitation) => {
              const isSelected = invitationsRespond.includes(invitation.id);
              const invitedWorkspace = workspaces[invitation.workspace.id];
              return (
                <div
                  key={invitation.id}
                  className={`flex cursor-pointer items-center gap-2 rounded border p-3.5 ${
                    isSelected
                      ? "border-custom-primary-100"
                      : "border-onboarding-border-200 hover:bg-onboarding-background-300/30"
                  }`}
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
                  <span className={`flex-shrink-0 ${isSelected ? "text-custom-primary-100" : "text-custom-text-200"}`}>
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                </div>
              );
            })}
        </div>

        <Button variant="primary" onClick={submitInvitations}>
          {isJoiningWorkspaces ? "Joining..." : "Join your team"}
        </Button>
      </div>
      <div className="mt-8 flex items-center justify-between rounded-sm bg-onboarding-background-300/30 px-4 py-3">
        <div className="flex items-center">
          <Search className="mr-2 h-4  w-4" />
          <span className="text-sm text-custom-text-200">Don&apos;t see your workspace?</span>
        </div>

        <div>
          <div
            className="rounded-md border border-custom-border-200 bg-onboarding-background-200 py-3 text-center text-sm font-medium text-custom-text-200 hover:cursor-pointer"
            onClick={setTryDiffAccount}
          >
            Try a different email address
          </div>
          <p className="mt-2 text-xs text-custom-text-300">
            Your right e-mail address could be from a Google or GitHub login.
          </p>
        </div>
      </div>
    </div>
  ) : (
    <EmptyInvitation email={currentUser!.email} setTryDiffAccount={setTryDiffAccount} />
  );
};

const EmptyInvitation = ({ email, setTryDiffAccount }: { email: string; setTryDiffAccount: () => void }) => (
  <div className="my-16 items-center justify-center rounded border border-onboarding-border-200 bg-onboarding-background-300/30 px-10 py-5 md:w-4/5 ">
    <p className="text-center text-lg font-semibold text-onboarding-text-300">Is your team already on Plane?</p>
    <p className="mt-6 text-center text-sm text-onboarding-text-300">
      We couldn’t find any existing workspaces for the email address {email}
    </p>
    <div
      className="mt-6 rounded-md border border-custom-border-200 bg-onboarding-background-200 py-3 text-center text-sm font-medium text-custom-text-200 hover:cursor-pointer"
      onClick={setTryDiffAccount}
    >
      Try a different email address
    </div>
    <p className="mt-2 text-center text-xs text-custom-text-300">
      Your right e-mail address could be from a Google or GitHub login.
    </p>
  </div>
);
