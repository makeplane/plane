"use client";

import { FC } from "react";
import Image from "next/image";
import { EMobileAuthModes, EMobileAuthSteps, TMobileAuthModes, TMobileAuthSteps } from "@plane/constants";
import { TMobileWorkspaceInvitation } from "@plane/types";
// assets
import planeLogo from "@/public/plane-logos/blue-without-text.png";

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
    <div className="relative flex items-center gap-2 text-3xl font-semibold text-onboarding-text-100">
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
      <div className="relative h-[50px] w-[50px]">
        <Image src={planeLogo} alt="Plane logo" className="object-contain" />
      </div>
      <div className="space-y-1">
        <h3 className="text-3xl font-semibold text-onboarding-text-100">{title}</h3>
        {description && <p className="font-medium text-onboarding-text-400">{description}</p>}
      </div>
    </div>
  );
};
