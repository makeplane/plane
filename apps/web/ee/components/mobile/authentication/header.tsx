"use client";

import { FC } from "react";
import { EMobileAuthModes, EMobileAuthSteps, TMobileAuthModes, TMobileAuthSteps } from "@plane/constants";
import { TMobileWorkspaceInvitation } from "@plane/types";
import { PlaneLogo } from "@plane/ui";

const AUTH_SIGNUP_HEADER_CONTENT_OPTIONS = {
  [EMobileAuthSteps.EMAIL]: {
    title: "sign up",
    description: "",
  },
  [EMobileAuthSteps.UNIQUE_CODE]: {
    title: "Sign up",
    description: "Sign up using a unique code sent to the email address above.",
  },
  [EMobileAuthSteps.PASSWORD]: {
    title: "Sign up",
    description: "Sign up using an email-password combination.",
  },
};

const AUTH_LOGIN_HEADER_CONTENT_OPTIONS = {
  [EMobileAuthSteps.EMAIL]: {
    title: "Log in or sign up",
    description: "",
  },
  [EMobileAuthSteps.UNIQUE_CODE]: {
    title: "Log in or sign up",
    description: "Log in using a unique code sent to the email address above.",
  },
  [EMobileAuthSteps.PASSWORD]: {
    title: "Log in or sign up",
    description: "Use your email-password combination to log in.",
  },
};

type TMobileAuthHeader = {
  authMode: TMobileAuthModes;
  authStep: TMobileAuthSteps;
  invitationDetails: TMobileWorkspaceInvitation | undefined;
};

export const MobileAuthHeader: FC<TMobileAuthHeader> = (props) => {
  // props
  const { authMode, authStep, invitationDetails } = props;

  // derived values
  const content =
    authMode === EMobileAuthModes.SIGN_UP
      ? AUTH_SIGNUP_HEADER_CONTENT_OPTIONS[authStep]
      : AUTH_LOGIN_HEADER_CONTENT_OPTIONS[authStep];
  const isInvitation = invitationDetails?.id || undefined;
  const workspaceName = invitationDetails?.workspace?.name || "";
  const title = isInvitation ? (
    <div className="relative flex items-center gap-2 text-3xl font-semibold text-custom-text-100">
      Join
      <div className="relative flex justify-center items-center !text-2xl !w-8 !h-8 border border-custom-primary-500 bg-custom-primary-500 text-white uppercase rounded">
        {workspaceName[0]}
      </div>
      {workspaceName}
    </div>
  ) : (
    content?.title
  );
  const description = isInvitation ? undefined : content?.description;

  return (
    <div className="relative space-y-6">
      <PlaneLogo height={51} width={84} className="text-custom-text-100" />
      <div className="flex flex-col gap-1">
        <h3 className="text-2xl font-semibold text-custom-text-100 leading-7">{title}</h3>
        {description && <p className="font-medium text-custom-text-400 leading-7">{description}</p>}
      </div>
    </div>
  );
};
