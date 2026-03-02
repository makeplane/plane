/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";

// Staff ID email transform constants
export const STAFF_EMAIL_PREFIX = "sh";
export const STAFF_EMAIL_DOMAIN = "@swing.shinhan.com";
export const STAFF_ID_PATTERN = /^\d{8}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Detect input type: 8-digit staff ID, email, or LDAP username
export const isStaffId = (value: string): boolean => STAFF_ID_PATTERN.test(value);
export const isEmail = (value: string): boolean => EMAIL_PATTERN.test(value);

type FormAction = { action: string; inputName: "email" | "username"; value: string };

/** Resolve form action URL based on identifier type and enabled auth methods */
export const resolveFormAction = (
  identifier: string,
  isSwingSSOEnabled: boolean,
  isLDAPEnabled: boolean
): FormAction => {
  if (isEmail(identifier)) {
    return { action: `${API_BASE_URL}/auth/sign-in/`, inputName: "email", value: identifier };
  }
  if (isStaffId(identifier) && isSwingSSOEnabled) {
    return { action: `${API_BASE_URL}/auth/swing-sso/sign-in/`, inputName: "username", value: identifier };
  }
  if (isStaffId(identifier) && !isLDAPEnabled) {
    return {
      action: `${API_BASE_URL}/auth/sign-in/`,
      inputName: "email",
      value: `${STAFF_EMAIL_PREFIX}${identifier}${STAFF_EMAIL_DOMAIN}`,
    };
  }
  // LDAP fallback
  return { action: `${API_BASE_URL}/auth/ldap/sign-in/`, inputName: "username", value: identifier };
};

/** Validate identifier format based on active auth methods */
export const validateStaffIdentifier = (
  value: string,
  isLDAPEnabled: boolean,
  isSwingSSOEnabled: boolean
): string | undefined => {
  const isAllNumeric = /^\d+$/.test(value);
  if (isAllNumeric && value.length !== 8) return "Staff ID must be exactly 8 digits";
  if (!isLDAPEnabled && !isSwingSSOEnabled && !isStaffId(value) && !isEmail(value)) {
    return "Enter 8-digit staff ID or email address";
  }
  return undefined;
};
