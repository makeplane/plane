/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TAuthErrorInfo } from "@plane/constants";
import { E_PASSWORD_STRENGTH, EErrorAlertType, EAuthErrorCodes } from "@plane/constants";

/**
 * @description Password strength levels
 */
export enum PasswordStrength {
  EMPTY = "empty",
  WEAK = "weak",
  FAIR = "fair",
  GOOD = "good",
  STRONG = "strong",
}

/**
 * Calculate password strength based on various criteria
 */
export const getPasswordStrength = (password: string): E_PASSWORD_STRENGTH => {
  if (!password || password === "" || password.length <= 0) {
    return E_PASSWORD_STRENGTH.EMPTY;
  }

  if (password.length < 8) {
    return E_PASSWORD_STRENGTH.LENGTH_NOT_VALID;
  }

  // Check all criteria
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()\-_+=[\]{}|;:'",.<>?/]/.test(password);

  if (hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar) {
    return E_PASSWORD_STRENGTH.STRENGTH_VALID;
  }

  return E_PASSWORD_STRENGTH.STRENGTH_NOT_VALID;
};

export type PasswordCriteria = {
  key: string;
  i18n_label: string;
  isValid: boolean;
};

/**
 * Get password criteria for validation display
 */
export const getPasswordCriteria = (password: string): PasswordCriteria[] => [
  {
    key: "length",
    i18n_label: "auth.common.password.criteria.length",
    isValid: password.length >= 8,
  },
  {
    key: "uppercase",
    i18n_label: "auth.common.password.criteria.uppercase",
    isValid: /[A-Z]/.test(password),
  },
  {
    key: "lowercase",
    i18n_label: "auth.common.password.criteria.lowercase",
    isValid: /[a-z]/.test(password),
  },
  {
    key: "number",
    i18n_label: "auth.common.password.criteria.number",
    isValid: /[0-9]/.test(password),
  },
  {
    key: "special",
    i18n_label: "auth.common.password.criteria.special",
    isValid: /[!@#$%^&*()\-_+=[\]{}|;:'",.<>?/]/.test(password),
  },
];

// Error code to message key under `auth.errors` in auth.json
const errorCodeKeys: { [key in EAuthErrorCodes]: string } = {
  // global
  [EAuthErrorCodes.INSTANCE_NOT_CONFIGURED]: "instance_not_configured",
  [EAuthErrorCodes.SIGNUP_DISABLED]: "sign_up_disabled",
  [EAuthErrorCodes.INVALID_PASSWORD]: "invalid_password",
  [EAuthErrorCodes.PASSWORD_TOO_WEAK]: "password_too_weak",
  [EAuthErrorCodes.SMTP_NOT_CONFIGURED]: "smtp_not_configured",
  // email check in both sign up and sign in
  [EAuthErrorCodes.INVALID_EMAIL]: "invalid_email",
  [EAuthErrorCodes.EMAIL_REQUIRED]: "email_required",
  // sign up
  [EAuthErrorCodes.USER_ALREADY_EXIST]: "user_already_exists",
  [EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP]: "email_password_required",
  [EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_UP]: "authentication_failed",
  [EAuthErrorCodes.INVALID_EMAIL_SIGN_UP]: "invalid_email",
  [EAuthErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED]: "email_code_required",
  [EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP]: "invalid_email",
  // sign in
  [EAuthErrorCodes.BOT_USER_LOGIN_FORBIDDEN]: "sign_in_not_allowed",
  [EAuthErrorCodes.USER_ACCOUNT_DEACTIVATED]: "user_account_deactivated",
  [EAuthErrorCodes.USER_DOES_NOT_EXIST]: "user_does_not_exist",
  [EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN]: "email_password_required",
  [EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_IN]: "authentication_failed",
  [EAuthErrorCodes.INVALID_EMAIL_SIGN_IN]: "invalid_email",
  [EAuthErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED]: "email_code_required",
  [EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN]: "invalid_email",
  // Both Sign in and Sign up
  [EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_IN]: "invalid_magic_code",
  [EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_UP]: "invalid_magic_code",
  [EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN]: "expired_magic_code",
  [EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP]: "expired_magic_code",
  [EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN]: "expired_magic_code",
  [EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP]: "expired_magic_code",
  // Oauth
  [EAuthErrorCodes.OAUTH_NOT_CONFIGURED]: "oauth_not_configured",
  [EAuthErrorCodes.GOOGLE_NOT_CONFIGURED]: "google_not_configured",
  [EAuthErrorCodes.GITHUB_NOT_CONFIGURED]: "github_not_configured",
  [EAuthErrorCodes.GITLAB_NOT_CONFIGURED]: "gitlab_not_configured",
  [EAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR]: "google_oauth_provider_error",
  [EAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR]: "github_oauth_provider_error",
  [EAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR]: "gitlab_oauth_provider_error",
  // Reset Password
  [EAuthErrorCodes.INVALID_PASSWORD_TOKEN]: "invalid_password_token",
  [EAuthErrorCodes.EXPIRED_PASSWORD_TOKEN]: "expired_password_token",
  // Change password
  [EAuthErrorCodes.MISSING_PASSWORD]: "password_required",
  [EAuthErrorCodes.INCORRECT_OLD_PASSWORD]: "incorrect_old_password",
  [EAuthErrorCodes.INVALID_NEW_PASSWORD]: "invalid_new_password",
  // set password
  [EAuthErrorCodes.PASSWORD_ALREADY_SET]: "password_already_set",
  // admin
  [EAuthErrorCodes.ADMIN_ALREADY_EXIST]: "admin_already_exists",
  [EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME]: "admin_email_password_first_name_required",
  [EAuthErrorCodes.INVALID_ADMIN_EMAIL]: "invalid_admin_email",
  [EAuthErrorCodes.INVALID_ADMIN_PASSWORD]: "invalid_admin_password",
  [EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD]: "email_password_required",
  [EAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED]: "authentication_failed",
  [EAuthErrorCodes.ADMIN_USER_ALREADY_EXIST]: "admin_user_already_exists",
  [EAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST]: "admin_user_does_not_exist",
  [EAuthErrorCodes.MAGIC_LINK_LOGIN_DISABLED]: "magic_link_login_disabled",
  [EAuthErrorCodes.PASSWORD_LOGIN_DISABLED]: "password_login_disabled",
  [EAuthErrorCodes.ADMIN_USER_DEACTIVATED]: "admin_user_deactivated",
  [EAuthErrorCodes.RATE_LIMIT_EXCEEDED]: "rate_limit_exceeded",
};

// Error handler
export const authErrorHandler = (
  errorCode: EAuthErrorCodes,
  t: (key: string) => string
): TAuthErrorInfo | undefined => {
  const bannerAlertErrorCodes = [
    EAuthErrorCodes.INSTANCE_NOT_CONFIGURED,
    EAuthErrorCodes.INVALID_EMAIL,
    EAuthErrorCodes.EMAIL_REQUIRED,
    EAuthErrorCodes.SIGNUP_DISABLED,
    EAuthErrorCodes.INVALID_PASSWORD,
    EAuthErrorCodes.SMTP_NOT_CONFIGURED,
    EAuthErrorCodes.USER_ALREADY_EXIST,
    EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_UP,
    EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP,
    EAuthErrorCodes.INVALID_EMAIL_SIGN_UP,
    EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP,
    EAuthErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED,
    EAuthErrorCodes.USER_DOES_NOT_EXIST,
    EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_IN,
    EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN,
    EAuthErrorCodes.INVALID_EMAIL_SIGN_IN,
    EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN,
    EAuthErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED,
    EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_IN,
    EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_UP,
    EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN,
    EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP,
    EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN,
    EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP,
    EAuthErrorCodes.OAUTH_NOT_CONFIGURED,
    EAuthErrorCodes.GOOGLE_NOT_CONFIGURED,
    EAuthErrorCodes.GITHUB_NOT_CONFIGURED,
    EAuthErrorCodes.GITLAB_NOT_CONFIGURED,
    EAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR,
    EAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR,
    EAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR,
    EAuthErrorCodes.INVALID_PASSWORD_TOKEN,
    EAuthErrorCodes.EXPIRED_PASSWORD_TOKEN,
    EAuthErrorCodes.INCORRECT_OLD_PASSWORD,
    EAuthErrorCodes.INVALID_NEW_PASSWORD,
    EAuthErrorCodes.PASSWORD_ALREADY_SET,
    EAuthErrorCodes.ADMIN_ALREADY_EXIST,
    EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME,
    EAuthErrorCodes.INVALID_ADMIN_EMAIL,
    EAuthErrorCodes.INVALID_ADMIN_PASSWORD,
    EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD,
    EAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED,
    EAuthErrorCodes.ADMIN_USER_ALREADY_EXIST,
    EAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST,
    EAuthErrorCodes.BOT_USER_LOGIN_FORBIDDEN,
    EAuthErrorCodes.USER_ACCOUNT_DEACTIVATED,
  ];

  if (bannerAlertErrorCodes.includes(errorCode)) {
    const key = errorCodeKeys[errorCode];
    return {
      type: EErrorAlertType.BANNER_ALERT,
      code: errorCode,
      title: t(`auth.errors.${key}.title`),
      message: t(`auth.errors.${key}.message`),
    };
  }

  return undefined;
};
