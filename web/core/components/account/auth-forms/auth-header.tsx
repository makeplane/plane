import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
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
      header: "auth.sign_in.header.step.email.header",
      subHeader: "",
    },
    [EAuthSteps.PASSWORD]: {
      header: "auth.sign_in.header.step.password.header",
      subHeader: "auth.sign_in.header.step.password.sub_header",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "auth.sign_in.header.step.unique_code.header",
      subHeader: "auth.sign_in.header.step.unique_code.sub_header",
    },
  },
  [EAuthModes.SIGN_UP]: {
    [EAuthSteps.EMAIL]: {
      header: "auth.sign_up.header.step.email.header",
      subHeader: "",
    },
    [EAuthSteps.PASSWORD]: {
      header: "auth.sign_up.header.step.password.header",
      subHeader: "auth.sign_up.header.step.password.sub_header",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "auth.sign_up.header.step.unique_code.header",
      subHeader: "auth.sign_up.header.step.unique_code.sub_header",
    },
  },
};

const workSpaceService = new WorkspaceService();

export const AuthHeader: FC<TAuthHeader> = observer((props) => {
  const { workspaceSlug, invitationId, invitationEmail, authMode, currentAuthStep, children } = props;
  // plane imports
  const { t } = useTranslation();

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
            {t("common.join")}{" "}
            <WorkspaceLogo logo={workspace?.logo_url} name={workspace?.name} classNames="size-9 flex-shrink-0" />{" "}
            {workspace.name}
          </div>
        ),
        subHeader: mode == EAuthModes.SIGN_UP ? "auth.sign_up.header.label" : "auth.sign_in.header.label",
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
        <h1 className="text-3xl font-bold text-onboarding-text-100">
          {typeof header === "string" ? t(header) : header}
        </h1>
        <p className="font-medium text-onboarding-text-400">{t(subHeader)}</p>
      </div>
      {children}
    </>
  );
});
