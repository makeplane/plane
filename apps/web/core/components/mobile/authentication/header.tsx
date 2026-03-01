/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import type { TMobileAuthModes, TMobileAuthSteps } from "@plane/constants";
import { EMobileAuthModes, EMobileAuthSteps } from "@plane/constants";
import { PlaneLogo } from "@plane/propel/icons";
import type { TMobileWorkspaceInvitation } from "@plane/types";

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

export function MobileAuthHeader(props: TMobileAuthHeader) {
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
    <div className="relative flex items-center gap-2 text-28 font-semibold text-primary">
      Join
      <div className="relative flex justify-center items-center !text-20 !w-8 !h-8 border border-accent-strong-500 bg-accent-primary text-on-color uppercase rounded">
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
      <PlaneLogo height={51} width={84} className="text-primary" />
      <div className="flex flex-col gap-1">
        <h3 className="text-20 font-semibold text-primary leading-7">{title}</h3>
        {description && <p className="font-medium text-placeholder leading-7">{description}</p>}
      </div>
    </div>
  );
}
