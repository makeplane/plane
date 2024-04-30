import { FC, useEffect, useState } from "react";
import { IWorkspaceMemberInvitation } from "@plane/types";
// components
import { WorkspaceLogo } from "@/components/workspace/logo";
// helpers
import { EAuthModes, EAuthSteps } from "@/helpers/authentication.helper";
// services
import { WorkspaceService } from "@/services/workspace.service";

type TAuthHeader = {
  workspaceSlug: string | undefined;
  invitationId: string | undefined;
  invitationEmail: string | undefined;
  authMode: EAuthModes;
  currentAuthStep: EAuthSteps;
  handleLoader: (isLoading: boolean) => void;
};

const Titles = {
  [EAuthModes.SIGN_IN]: {
    [EAuthSteps.EMAIL]: {
      header: "Sign in to Plane",
      subHeader: "Get back to your projects and make progress",
    },
    [EAuthSteps.PASSWORD]: {
      header: "Sign in to Plane",
      subHeader: "Get back to your projects and make progress",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "Sign in to Plane",
      subHeader: "Get back to your projects and make progress",
    },
  },
  [EAuthModes.SIGN_UP]: {
    [EAuthSteps.EMAIL]: {
      header: "Create your account",
      subHeader: "Start tracking your projects with Plane",
    },
    [EAuthSteps.PASSWORD]: {
      header: "Create your account",
      subHeader: "Progress, visualize, and measure work how it works best for you.",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "Create your account",
      subHeader: "Progress, visualize, and measure work how it works best for you.",
    },
  },
};

const workSpaceService = new WorkspaceService();

export const AuthHeader: FC<TAuthHeader> = (props) => {
  const { workspaceSlug, invitationId, invitationEmail, authMode, currentAuthStep, handleLoader } = props;
  // state
  const [invitation, setInvitation] = useState<IWorkspaceMemberInvitation | undefined>(undefined);

  const getHeaderSubHeader = (
    step: EAuthSteps,
    mode: EAuthModes,
    invitation: IWorkspaceMemberInvitation | undefined,
    email: string | undefined
  ) => {
    if (invitation && email && invitation.email === email && invitation.workspace) {
      const workspace = invitation.workspace;
      return {
        header: (
          <>
            Join <WorkspaceLogo logo={workspace?.logo} name={workspace?.name} classNames="w-8 h-9" /> {workspace.name}
          </>
        ),
        subHeader: `${
          mode == EAuthModes.SIGN_UP ? "Create an account" : "Sign in"
        } to start managing work with your team.`,
      };
    }

    return Titles[mode][step];
  };

  useEffect(() => {
    if (workspaceSlug && invitationId) {
      handleLoader(true);
      workSpaceService
        .getWorkspaceInvitation(workspaceSlug, invitationId)
        .then((res) => setInvitation(res))
        .catch(() => setInvitation(undefined))
        .finally(() => handleLoader(false));
    } else setInvitation(undefined);
  }, [workspaceSlug, invitationId, handleLoader]);

  const { header, subHeader } = getHeaderSubHeader(currentAuthStep, authMode, invitation, invitationEmail);

  return (
    <div className="space-y-1 text-center">
      <h3 className="text-3xl font-bold text-onboarding-text-100">{header}</h3>
      <p className="font-medium text-onboarding-text-400">{subHeader}</p>
    </div>
  );
};
