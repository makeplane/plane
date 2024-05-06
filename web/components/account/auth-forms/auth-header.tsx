import { FC, ReactNode } from "react";
import useSWR from "swr";
import { IWorkspaceMemberInvitation } from "@plane/types";
import { Spinner } from "@plane/ui";
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
  children: ReactNode;
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
        <Spinner />
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
