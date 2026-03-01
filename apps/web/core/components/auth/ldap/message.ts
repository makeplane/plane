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

const _LDAP_ERROR_CODES = {
  5200: "LDAP_NOT_CONFIGURED",
  5205: "LDAP_BIND_FAILED",
  5210: "LDAP_SERVER_DOWN",
  5215: "LDAP_CONNECTION_ERROR",
  5220: "LDAP_SEARCH_ERROR",
  5230: "LDAP_USER_NOT_FOUND",
  5235: "LDAP_AUTHENTICATION_FAILED",
  5240: "LDAP_NO_EMAIL_FOUND",
} as const;

export type TLDAPErrorInfo = {
  title: string;
  message: string;
};

type TLDAPErrorCode = keyof typeof _LDAP_ERROR_CODES;

export const isLDAPErrorCode = (code: number): code is TLDAPErrorCode => {
  return code in _LDAP_ERROR_CODES;
};

export const LDAP_ERROR_CODE_MESSAGES: Record<keyof typeof _LDAP_ERROR_CODES, TLDAPErrorInfo> = {
  [5200]: {
    title: "LDAP not configured",
    message: "LDAP authentication is not set up. Contact your administrator for access.",
  },
  [5205]: {
    title: "Connection failed",
    message: "Unable to connect to LDAP server. Please contact your administrator.",
  },
  [5210]: {
    title: "Server unavailable",
    message: "LDAP server is currently unavailable. Please try again later.",
  },
  [5215]: {
    title: "Connection error",
    message: "Unable to reach LDAP server. Check your network or try again later.",
  },
  [5220]: {
    title: "Search failed",
    message: "Unable to verify your account. Please contact your administrator.",
  },
  [5230]: {
    title: "User not found",
    message: "Your username was not found. Please check your credentials and try again.",
  },
  [5235]: {
    title: "Authentication failed",
    message: "Invalid username or password. Please check your credentials and try again.",
  },
  [5240]: {
    title: "Email not found",
    message: "No email address found for your account. Contact your administrator.",
  },
} as const;
