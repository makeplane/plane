import React, { useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import useSWR, { mutate } from "swr";
import { trackEvent } from "helpers/event-tracker.helper";
// components
import { Button, Loader } from "@plane/ui";

// helpers
import { truncateText } from "helpers/string.helper";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { WorkspaceService } from "services/workspace.service";

// contants
import { USER_WORKSPACES, USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";
import { ROLE } from "constants/workspace";
// types
import { IWorkspaceMemberInvitation } from "types";

type Props = {
  handleNextStep: () => void;
  setTryDiffAccount: () => void;
};
const workspaceService = new WorkspaceService();

const Invitations: React.FC<Props> = (props) => {
  const { handleNextStep, setTryDiffAccount } = props;
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);

  const {
    workspace: workspaceStore,
    user: { currentUser, updateCurrentUser },
  } = useMobxStore();

  const {
    data: invitations,
    mutate: mutateInvitations,
    isLoading,
  } = useSWR(USER_WORKSPACE_INVITATIONS, () => workspaceService.userWorkspaceInvitations());

  const handleInvitation = (workspace_invitation: IWorkspaceMemberInvitation, action: "accepted" | "withdraw") => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => [...prevData, workspace_invitation.id]);
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) => prevData.filter((item: string) => item !== workspace_invitation.id));
    }
  };

  const updateLastWorkspace = async () => {
    if (!workspaceStore.workspaces) return;
    await updateCurrentUser({
      last_workspace_id: workspaceStore.workspaces[0].id,
    });
  };

  const submitInvitations = async () => {
    if (invitationsRespond.length <= 0) return;

    setIsJoiningWorkspaces(true);

    await workspaceService
      .joinWorkspaces({ invitations: invitationsRespond })
      .then(async (res) => {
        trackEvent("WORKSPACE_USER_INVITE_ACCEPT", res);
        await mutateInvitations();
        await workspaceStore.fetchWorkspaces();
        await mutate(USER_WORKSPACES);
        await updateLastWorkspace();
        await handleNextStep();
      })
      .finally(() => setIsJoiningWorkspaces(false));
  };

  return invitations && invitations.length > 0 ? (
    <div>
      <div className="space-y-4 md:w-2/3 ">
        <p className="font-semibold pb-2 text-xl sm:text-2xl">Choose a workspace to join </p>
        <div>
          {invitations &&
            invitations.length > 0 &&
            invitations.map((invitation) => {
              const isSelected = invitationsRespond.includes(invitation.id);
              return (
                <div
                  key={invitation.id}
                  className={`flex cursor-pointer items-center gap-2 border p-3.5 rounded ${
                    isSelected
                      ? "border-custom-primary-100"
                      : "border-onboarding-border-200 hover:bg-onboarding-background-300/30"
                  }`}
                  onClick={() => handleInvitation(invitation, isSelected ? "withdraw" : "accepted")}
                >
                  <div className="flex-shrink-0">
                    <div className="grid place-items-center h-9 w-9 rounded">
                      {invitation.workspace.logo && invitation.workspace.logo !== "" ? (
                        <img
                          src={invitation.workspace.logo}
                          height="100%"
                          width="100%"
                          className="rounded"
                          alt={invitation.workspace.name}
                        />
                      ) : (
                        <span className="grid place-items-center h-9 w-9 py-1.5 px-3 rounded bg-gray-700 uppercase text-white">
                          {invitation.workspace.name[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{truncateText(invitation.workspace.name, 30)}</div>
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
      <div className="py-3 px-4 mt-8 bg-onboarding-background-300/30 rounded-sm flex justify-between items-center">
        <div className="flex items-center">
          <Search className="h-4 w-4  mr-2" />
          <span className="text-sm text-custom-text-200">Don&apos;t see your workspace?</span>
        </div>

        <div>
          <div
            className="bg-onboarding-background-200 py-3 text-center hover:cursor-pointer text-custom-text-200 rounded-md text-sm font-medium border border-custom-border-200"
            onClick={setTryDiffAccount}
          >
            Try a different email address
          </div>
          <p className="text-xs mt-2 text-custom-text-300">
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
  <div className="items-center md:w-4/5 bg-onboarding-background-300/30 my-16 border-onboarding-border-200 py-5 px-10 rounded border justify-center ">
    <p className="text-lg text-onboarding-text-300 text-center font-semibold">Is your team already on Plane?</p>
    <p className="text-sm text-onboarding-text-300 mt-6 text-center">
      We couldn’t find any existing workspaces for the email address {email}
    </p>
    <div
      className="bg-onboarding-background-200 mt-6 py-3 text-center hover:cursor-pointer text-custom-text-200 rounded-md text-sm font-medium border border-custom-border-200"
      onClick={setTryDiffAccount}
    >
      Try a different email address
    </div>
    <p className="text-xs mt-2 text-center text-custom-text-300">
      Your right e-mail address could be from a Google or GitHub login.
    </p>
  </div>
);

export default Invitations;
