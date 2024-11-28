import { FC, ReactNode } from "react";
import useSWR from "swr";
import { IWorkspaceMemberInvitation } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common";
import { WorkspaceLogo } from "@/components/workspace/logo";
// helpers
import { EAuthModes, EAuthSteps } from "@/helpers/authentication.helper";
import { WorkspaceService } from "@/plane-web/services";
// services

type TAuthHeader = {
  workspaceSlug: string | undefined;
  invitationId: string | undefined;
  invitationEmail: string | undefined;
  authMode: EAuthModes;
  currentAuthStep: EAuthSteps;
  children: ReactNode;
};

const Titles = {
  [EAuthModes.SIGN_IN]: {
    [EAuthSteps.EMAIL]: {
      header: "Log in or sign up",
      subHeader: "",
    },
    [EAuthSteps.PASSWORD]: {
      header: "Log in or sign up",
      subHeader: "Use your email-password combination to log in.",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "Log in or Sign up",
      subHeader: "Log in using a unique code sent to the email address above.",
    },
  },
  [EAuthModes.SIGN_UP]: {
    [EAuthSteps.EMAIL]: {
      header: "Sign up",
      subHeader: "",
    },
    [EAuthSteps.PASSWORD]: {
      header: "Sign up",
      subHeader: "Sign up using an email-password combination.",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "Sign up",
      subHeader: "Sign up using a unique code sent to the email address above.",
    },
  },
};

const workSpaceService = new WorkspaceService();

export const AuthHeader: FC<TAuthHeader> = (props) => {
  const { workspaceSlug, invitationId, invitationEmail, authMode, currentAuthStep, children } = props;

  const { data: invitation, isLoading } = useSWR(
    workspaceSlug && invitationId ? `WORKSPACE_INVITATION_${workspaceSlug}_${invitationId}` : null,
    async () => workspaceSlug && invitationId && workSpaceService.getWorkspaceInvitation(workspaceSlug, invitationId),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

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
          <div className="relative inline-flex items-center gap-2">
            Join <WorkspaceLogo logo={workspace?.logo} name={workspace?.name} classNames="w-8 h-9 flex-shrink-0" />{" "}
            {workspace.name}
          </div>
        ),
        subHeader: `${
          mode == EAuthModes.SIGN_UP ? "Create an account" : "Sign in"
        } to start managing work with your team.`,
      };
    }

    return Titles[mode][step];
  };

  const { header, subHeader } = getHeaderSubHeader(currentAuthStep, authMode, invitation || undefined, invitationEmail);

  if (isLoading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );

  return (
    <>
      <div className="space-y-1 text-center">
        <h3 className="text-3xl font-bold text-onboarding-text-100">{header}</h3>
        <p className="font-medium text-onboarding-text-400">{subHeader}</p>
      </div>
      {children}
    </>
  );
};
