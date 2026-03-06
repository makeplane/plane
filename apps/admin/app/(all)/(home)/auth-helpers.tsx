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

import Link from "next/link";
// plane packages
import type { TAdminAuthErrorInfo } from "@plane/constants";
import { SUPPORT_EMAIL, EAdminAuthErrorCodes } from "@plane/constants";

export enum EErrorAlertType {
  BANNER_ALERT = "BANNER_ALERT",
  INLINE_FIRST_NAME = "INLINE_FIRST_NAME",
  INLINE_EMAIL = "INLINE_EMAIL",
  INLINE_PASSWORD = "INLINE_PASSWORD",
  INLINE_EMAIL_CODE = "INLINE_EMAIL_CODE",
}

const errorCodeMessages: {
  [key in EAdminAuthErrorCodes]: { title: string; message: (email?: string) => React.ReactNode };
} = {
  // admin
  [EAdminAuthErrorCodes.ADMIN_ALREADY_EXIST]: {
    title: `Admin already exists`,
    message: () => `Admin already exists. Please try again.`,
  },
  [EAdminAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME]: {
    title: `Email, password and first name required`,
    message: () => `Email, password and first name required. Please try again.`,
  },
  [EAdminAuthErrorCodes.INVALID_ADMIN_EMAIL]: {
    title: `Invalid admin email`,
    message: () => `Invalid admin email. Please try again.`,
  },
  [EAdminAuthErrorCodes.INVALID_ADMIN_PASSWORD]: {
    title: `Invalid admin password`,
    message: () => `Invalid admin password. Please try again.`,
  },
  [EAdminAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD]: {
    title: `Email and password required`,
    message: () => `Email and password required. Please try again.`,
  },
  [EAdminAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED]: {
    title: `Authentication failed`,
    message: () => `Authentication failed. Please try again.`,
  },
  [EAdminAuthErrorCodes.ADMIN_USER_ALREADY_EXIST]: {
    title: `Admin user already exists`,
    message: () => (
      <div>
        Admin user already exists.&nbsp;
        <Link className="underline underline-offset-4 font-medium hover:font-bold transition-all" href={`/admin`}>
          Sign In
        </Link>
        &nbsp;now.
      </div>
    ),
  },
  [EAdminAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST]: {
    title: `Admin user does not exist`,
    message: () => (
      <div>
        Admin user does not exist.&nbsp;
        <Link className="underline underline-offset-4 font-medium hover:font-bold transition-all" href={`/admin`}>
          Sign In
        </Link>
        &nbsp;now.
      </div>
    ),
  },
  [EAdminAuthErrorCodes.ADMIN_USER_DEACTIVATED]: {
    title: `User account deactivated`,
    message: () => `User account deactivated. Please contact ${SUPPORT_EMAIL ? SUPPORT_EMAIL : "administrator"}.`,
  },
  [EAdminAuthErrorCodes.ADMIN_NOT_INSTANCE_ADMIN]: {
    title: `Not authorized`,
    message: () => `You are not authorized as an instance administrator.`,
  },
  [EAdminAuthErrorCodes.GOOGLE_NOT_CONFIGURED]: {
    title: `Google not configured`,
    message: () => `Google authentication is not configured. Please contact your administrator.`,
  },
  [EAdminAuthErrorCodes.GITHUB_NOT_CONFIGURED]: {
    title: `GitHub not configured`,
    message: () => `GitHub authentication is not configured. Please contact your administrator.`,
  },
  [EAdminAuthErrorCodes.GITLAB_NOT_CONFIGURED]: {
    title: `GitLab not configured`,
    message: () => `GitLab authentication is not configured. Please contact your administrator.`,
  },
  [EAdminAuthErrorCodes.GITEA_NOT_CONFIGURED]: {
    title: `Gitea not configured`,
    message: () => `Gitea authentication is not configured. Please contact your administrator.`,
  },
  [EAdminAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR]: {
    title: `Google authentication failed`,
    message: () => `Google authentication failed. Please try again.`,
  },
  [EAdminAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR]: {
    title: `GitHub authentication failed`,
    message: () => `GitHub authentication failed. Please try again.`,
  },
  [EAdminAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR]: {
    title: `GitLab authentication failed`,
    message: () => `GitLab authentication failed. Please try again.`,
  },
  [EAdminAuthErrorCodes.GITEA_OAUTH_PROVIDER_ERROR]: {
    title: `Gitea authentication failed`,
    message: () => `Gitea authentication failed. Please try again.`,
  },
  [EAdminAuthErrorCodes.OIDC_NOT_CONFIGURED]: {
    title: `OIDC not configured`,
    message: () => `OIDC authentication is not configured. Please contact your administrator.`,
  },
  [EAdminAuthErrorCodes.OIDC_PROVIDER_ERROR]: {
    title: `OIDC authentication failed`,
    message: () => `OIDC authentication failed. Please try again.`,
  },
  [EAdminAuthErrorCodes.SAML_NOT_CONFIGURED]: {
    title: `SAML not configured`,
    message: () => `SAML authentication is not configured. Please contact your administrator.`,
  },
  [EAdminAuthErrorCodes.SAML_PROVIDER_ERROR]: {
    title: `SAML authentication failed`,
    message: () => `SAML authentication failed. Please try again.`,
  },
  [EAdminAuthErrorCodes.LDAP_NOT_CONFIGURED]: {
    title: `LDAP not configured`,
    message: () => `LDAP authentication is not configured. Please contact your administrator.`,
  },
  [EAdminAuthErrorCodes.LDAP_AUTHENTICATION_FAILED]: {
    title: `LDAP authentication failed`,
    message: () => `LDAP authentication failed. Please check your credentials and try again.`,
  },
};

export const authErrorHandler = (errorCode: EAdminAuthErrorCodes, email?: string): TAdminAuthErrorInfo | undefined => {
  const bannerAlertErrorCodes = [
    EAdminAuthErrorCodes.ADMIN_ALREADY_EXIST,
    EAdminAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME,
    EAdminAuthErrorCodes.INVALID_ADMIN_EMAIL,
    EAdminAuthErrorCodes.INVALID_ADMIN_PASSWORD,
    EAdminAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD,
    EAdminAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED,
    EAdminAuthErrorCodes.ADMIN_USER_ALREADY_EXIST,
    EAdminAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST,
    EAdminAuthErrorCodes.ADMIN_USER_DEACTIVATED,
    EAdminAuthErrorCodes.ADMIN_NOT_INSTANCE_ADMIN,
    EAdminAuthErrorCodes.GOOGLE_NOT_CONFIGURED,
    EAdminAuthErrorCodes.GITHUB_NOT_CONFIGURED,
    EAdminAuthErrorCodes.GITLAB_NOT_CONFIGURED,
    EAdminAuthErrorCodes.GITEA_NOT_CONFIGURED,
    EAdminAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR,
    EAdminAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR,
    EAdminAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR,
    EAdminAuthErrorCodes.GITEA_OAUTH_PROVIDER_ERROR,
    EAdminAuthErrorCodes.OIDC_NOT_CONFIGURED,
    EAdminAuthErrorCodes.OIDC_PROVIDER_ERROR,
    EAdminAuthErrorCodes.SAML_NOT_CONFIGURED,
    EAdminAuthErrorCodes.SAML_PROVIDER_ERROR,
    EAdminAuthErrorCodes.LDAP_NOT_CONFIGURED,
    EAdminAuthErrorCodes.LDAP_AUTHENTICATION_FAILED,
  ];

  if (bannerAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.BANNER_ALERT,
      code: errorCode,
      title: errorCodeMessages[errorCode]?.title || "Error",
      message: errorCodeMessages[errorCode]?.message(email) || "Something went wrong. Please try again.",
    };

  return undefined;
};
