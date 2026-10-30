/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TTranslationStore } from "@plane/i18n";
import type { ReactNode } from "react";
import Link from "next/link";
// plane imports
import { SUPPORT_EMAIL } from "@plane/constants";

export enum EPageTypes {
  PUBLIC = "PUBLIC",
  NON_AUTHENTICATED = "NON_AUTHENTICATED",
  SET_PASSWORD = "SET_PASSWORD",
  ONBOARDING = "ONBOARDING",
  AUTHENTICATED = "AUTHENTICATED",
}

export enum EAuthModes {
  SIGN_IN = "SIGN_IN",
  SIGN_UP = "SIGN_UP",
}

export enum EAuthSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  UNIQUE_CODE = "UNIQUE_CODE",
}

export enum EErrorAlertType {
  BANNER_ALERT = "BANNER_ALERT",
  INLINE_FIRST_NAME = "INLINE_FIRST_NAME",
  INLINE_EMAIL = "INLINE_EMAIL",
  INLINE_PASSWORD = "INLINE_PASSWORD",
  INLINE_EMAIL_CODE = "INLINE_EMAIL_CODE",
}

export enum EAuthenticationErrorCodes {
  // Global
  INSTANCE_NOT_CONFIGURED = "5000",
  INVALID_EMAIL = "5005",
  EMAIL_REQUIRED = "5010",
  SIGNUP_DISABLED = "5015",
  MAGIC_LINK_LOGIN_DISABLED = "5016",
  BOT_USER_LOGIN_FORBIDDEN = "5017",
  PASSWORD_LOGIN_DISABLED = "5018",
  USER_ACCOUNT_DEACTIVATED = "5019",
  // Password strength
  INVALID_PASSWORD = "5020",
  PASSWORD_TOO_WEAK = "5021",
  SMTP_NOT_CONFIGURED = "5025",
  // Sign Up
  USER_ALREADY_EXIST = "5030",
  AUTHENTICATION_FAILED_SIGN_UP = "5035",
  REQUIRED_EMAIL_PASSWORD_SIGN_UP = "5040",
  INVALID_EMAIL_SIGN_UP = "5045",
  INVALID_EMAIL_MAGIC_SIGN_UP = "5050",
  MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED = "5055",
  // Sign In
  USER_DOES_NOT_EXIST = "5060",
  AUTHENTICATION_FAILED_SIGN_IN = "5065",
  REQUIRED_EMAIL_PASSWORD_SIGN_IN = "5070",
  INVALID_EMAIL_SIGN_IN = "5075",
  INVALID_EMAIL_MAGIC_SIGN_IN = "5080",
  MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED = "5085",
  // Both Sign in and Sign up for magic
  INVALID_MAGIC_CODE_SIGN_IN = "5090",
  INVALID_MAGIC_CODE_SIGN_UP = "5092",
  EXPIRED_MAGIC_CODE_SIGN_IN = "5095",
  EXPIRED_MAGIC_CODE_SIGN_UP = "5097",
  EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN = "5100",
  EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP = "5102",
  // Oauth
  OAUTH_NOT_CONFIGURED = "5104",
  GOOGLE_NOT_CONFIGURED = "5105",
  GITHUB_NOT_CONFIGURED = "5110",
  GITLAB_NOT_CONFIGURED = "5111",
  GOOGLE_OAUTH_PROVIDER_ERROR = "5115",
  GITHUB_OAUTH_PROVIDER_ERROR = "5120",
  GITLAB_OAUTH_PROVIDER_ERROR = "5121",
  // Reset Password
  INVALID_PASSWORD_TOKEN = "5125",
  EXPIRED_PASSWORD_TOKEN = "5130",
  // Change password
  INCORRECT_OLD_PASSWORD = "5135",
  MISSING_PASSWORD = "5138",
  INVALID_NEW_PASSWORD = "5140",
  // set password
  PASSWORD_ALREADY_SET = "5145",
  // Admin
  ADMIN_ALREADY_EXIST = "5150",
  REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME = "5155",
  INVALID_ADMIN_EMAIL = "5160",
  INVALID_ADMIN_PASSWORD = "5165",
  REQUIRED_ADMIN_EMAIL_PASSWORD = "5170",
  ADMIN_AUTHENTICATION_FAILED = "5175",
  ADMIN_USER_ALREADY_EXIST = "5180",
  ADMIN_USER_DOES_NOT_EXIST = "5185",
  ADMIN_USER_DEACTIVATED = "5190",
  // Rate limit
  RATE_LIMIT_EXCEEDED = "5900",
}

export type TAuthErrorInfo = {
  type: EErrorAlertType;
  code: EAuthenticationErrorCodes;
  title: string;
  message: ReactNode;
};

function getErrorCodeMessages(t: TTranslationStore["t"]) {
  const errorCodeMessages: {
    [key in EAuthenticationErrorCodes]: { title: string; message: (email?: string) => ReactNode };
  } = {
    // global
    [EAuthenticationErrorCodes.INSTANCE_NOT_CONFIGURED]: {
      title: t("web_ui.instance_not_configured"),
      message: () => t("web_ui.instance_not_configured_please_contact_your_administrator"),
    },
    [EAuthenticationErrorCodes.INVALID_EMAIL]: {
      title: t("web_ui.invalid_email"),
      message: () => t("web_ui.invalid_email_please_try_again"),
    },
    [EAuthenticationErrorCodes.EMAIL_REQUIRED]: {
      title: t("web_ui.email_required"),
      message: () => t("web_ui.email_required_please_try_again"),
    },
    [EAuthenticationErrorCodes.SIGNUP_DISABLED]: {
      title: t("web_ui.sign_up_disabled"),
      message: () => t("web_ui.sign_up_disabled_please_contact_your_administrator"),
    },
    [EAuthenticationErrorCodes.MAGIC_LINK_LOGIN_DISABLED]: {
      title: t("web_ui.magic_link_login_disabled"),
      message: () => t("web_ui.magic_link_login_disabled_please_contact_your_administrator"),
    },
    [EAuthenticationErrorCodes.PASSWORD_LOGIN_DISABLED]: {
      title: t("web_ui.password_login_disabled"),
      message: () => t("web_ui.password_login_disabled_please_contact_your_administrator"),
    },
    [EAuthenticationErrorCodes.USER_ACCOUNT_DEACTIVATED]: {
      title: t("web_ui.user_account_deactivated"),
      message: () =>
        t("web_ui.dynamic_user_account_deactivated_please_contact_value0", {
          value0: SUPPORT_EMAIL ? SUPPORT_EMAIL : t("role_details.admin.title"),
        }),
    },
    [EAuthenticationErrorCodes.BOT_USER_LOGIN_FORBIDDEN]: {
      title: t("web_ui.sign_in_not_allowed"),
      message: () => t("web_ui.this_account_cannot_be_used_to_sign_in_please_use_a_personal_account"),
    },
    [EAuthenticationErrorCodes.INVALID_PASSWORD]: {
      title: t("web_ui.invalid_password"),
      message: () => t("web_ui.invalid_password_please_try_again"),
    },
    [EAuthenticationErrorCodes.PASSWORD_TOO_WEAK]: {
      title: t("web_ui.password_too_weak"),
      message: () => t("web_ui.please_use_a_stronger_password"),
    },
    [EAuthenticationErrorCodes.SMTP_NOT_CONFIGURED]: {
      title: t("web_ui.smtp_not_configured"),
      message: () => t("web_ui.smtp_not_configured_please_contact_your_administrator"),
    },

    // sign up
    [EAuthenticationErrorCodes.USER_ALREADY_EXIST]: {
      title: t("web_ui.user_already_exists"),
      message: (email = undefined) => (
        <div>
          {t("web_ui.your_account_is_already_registered_nbsp")}{" "}
          <Link
            className="font-medium underline underline-offset-4 transition-all hover:font-bold"
            href={`/sign-in${email ? `?email=${encodeURIComponent(email)}` : ``}`}
          >
            {t("web_ui.sign_in")}{" "}
          </Link>
          {t("web_ui.nbsp_now")}{" "}
        </div>
      ),
    },
    [EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP]: {
      title: t("web_ui.email_and_password_required"),
      message: () => t("web_ui.email_and_password_required_please_try_again"),
    },
    [EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_UP]: {
      title: t("web_ui.authentication_failed"),
      message: () => t("web_ui.authentication_failed_please_try_again"),
    },
    [EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_UP]: {
      title: t("web_ui.invalid_email"),
      message: () => t("web_ui.invalid_email_please_try_again"),
    },
    [EAuthenticationErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED]: {
      title: t("web_ui.email_and_code_required"),
      message: () => t("web_ui.email_and_code_required_please_try_again"),
    },
    [EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP]: {
      title: t("web_ui.invalid_email"),
      message: () => t("web_ui.invalid_email_please_try_again"),
    },

    [EAuthenticationErrorCodes.USER_DOES_NOT_EXIST]: {
      title: t("web_ui.user_does_not_exist"),
      message: (email = undefined) => (
        <div>
          {t("web_ui.no_account_found_nbsp")}{" "}
          <Link
            className="font-medium underline underline-offset-4 transition-all hover:font-bold"
            href={`/${email ? `?email=${encodeURIComponent(email)}` : ``}`}
          >
            {t("web_ui.create_one")}{" "}
          </Link>
          {t("web_ui.nbsp_to_get_started")}{" "}
        </div>
      ),
    },
    [EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN]: {
      title: t("web_ui.email_and_password_required"),
      message: () => t("web_ui.email_and_password_required_please_try_again"),
    },
    [EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_IN]: {
      title: t("web_ui.authentication_failed"),
      message: () => t("web_ui.authentication_failed_please_try_again"),
    },
    [EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_IN]: {
      title: t("web_ui.invalid_email"),
      message: () => t("web_ui.invalid_email_please_try_again"),
    },
    [EAuthenticationErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED]: {
      title: t("web_ui.email_and_code_required"),
      message: () => t("web_ui.email_and_code_required_please_try_again"),
    },
    [EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN]: {
      title: t("web_ui.invalid_email"),
      message: () => t("web_ui.invalid_email_please_try_again"),
    },

    // Both Sign in and Sign up
    [EAuthenticationErrorCodes.INVALID_MAGIC_CODE_SIGN_IN]: {
      title: t("web_ui.authentication_failed"),
      message: () => t("web_ui.invalid_magic_code_please_try_again"),
    },
    [EAuthenticationErrorCodes.INVALID_MAGIC_CODE_SIGN_UP]: {
      title: t("web_ui.authentication_failed"),
      message: () => t("web_ui.invalid_magic_code_please_try_again"),
    },
    [EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN]: {
      title: t("web_ui.expired_magic_code"),
      message: () => t("web_ui.expired_magic_code_please_try_again"),
    },
    [EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP]: {
      title: t("web_ui.expired_magic_code"),
      message: () => t("web_ui.expired_magic_code_please_try_again"),
    },
    [EAuthenticationErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN]: {
      title: t("web_ui.expired_magic_code"),
      message: () => t("web_ui.expired_magic_code_please_try_again"),
    },
    [EAuthenticationErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP]: {
      title: t("web_ui.expired_magic_code"),
      message: () => t("web_ui.expired_magic_code_please_try_again"),
    },

    // Oauth
    [EAuthenticationErrorCodes.OAUTH_NOT_CONFIGURED]: {
      title: t("web_ui.oauth_not_configured"),
      message: () => t("web_ui.oauth_not_configured_please_contact_your_administrator"),
    },
    [EAuthenticationErrorCodes.GOOGLE_NOT_CONFIGURED]: {
      title: t("web_ui.google_not_configured"),
      message: () => t("web_ui.google_not_configured_please_contact_your_administrator"),
    },
    [EAuthenticationErrorCodes.GITHUB_NOT_CONFIGURED]: {
      title: t("web_ui.github_not_configured"),
      message: () => t("web_ui.github_not_configured_please_contact_your_administrator"),
    },
    [EAuthenticationErrorCodes.GITLAB_NOT_CONFIGURED]: {
      title: t("web_ui.gitlab_not_configured"),
      message: () => t("web_ui.gitlab_not_configured_please_contact_your_administrator"),
    },
    [EAuthenticationErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR]: {
      title: t("web_ui.google_oauth_provider_error"),
      message: () => t("web_ui.google_oauth_provider_error_please_try_again"),
    },
    [EAuthenticationErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR]: {
      title: t("web_ui.github_oauth_provider_error"),
      message: () => t("web_ui.github_oauth_provider_error_please_try_again"),
    },
    [EAuthenticationErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR]: {
      title: t("web_ui.gitlab_oauth_provider_error"),
      message: () => t("web_ui.gitlab_oauth_provider_error_please_try_again"),
    },

    // Reset Password
    [EAuthenticationErrorCodes.INVALID_PASSWORD_TOKEN]: {
      title: t("web_ui.invalid_password_token"),
      message: () => t("web_ui.invalid_password_token"),
    },
    [EAuthenticationErrorCodes.EXPIRED_PASSWORD_TOKEN]: {
      title: t("web_ui.expired_password_token"),
      message: () => t("web_ui.expired_password_token_please_try_again"),
    },

    // Change password
    [EAuthenticationErrorCodes.MISSING_PASSWORD]: {
      title: t("web_ui.password_required"),
      message: () => t("web_ui.password_required_please_try_again"),
    },
    [EAuthenticationErrorCodes.INCORRECT_OLD_PASSWORD]: {
      title: t("web_ui.incorrect_old_password"),
      message: () => t("web_ui.incorrect_old_password_please_try_again"),
    },
    [EAuthenticationErrorCodes.INVALID_NEW_PASSWORD]: {
      title: t("web_ui.invalid_new_password"),
      message: () => t("web_ui.invalid_new_password_please_try_again"),
    },

    // set password
    [EAuthenticationErrorCodes.PASSWORD_ALREADY_SET]: {
      title: t("web_ui.password_already_set"),
      message: () => t("web_ui.password_already_set_please_try_again"),
    },

    // admin
    [EAuthenticationErrorCodes.ADMIN_ALREADY_EXIST]: {
      title: t("web_ui.admin_already_exists"),
      message: () => t("web_ui.admin_already_exists_please_try_again"),
    },
    [EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME]: {
      title: t("web_ui.email_password_and_first_name_required"),
      message: () => t("web_ui.email_password_and_first_name_required_please_try_again"),
    },
    [EAuthenticationErrorCodes.INVALID_ADMIN_EMAIL]: {
      title: t("web_ui.invalid_admin_email"),
      message: () => t("web_ui.invalid_admin_email_please_try_again"),
    },
    [EAuthenticationErrorCodes.INVALID_ADMIN_PASSWORD]: {
      title: t("web_ui.invalid_admin_password"),
      message: () => t("web_ui.invalid_admin_password_please_try_again"),
    },
    [EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD]: {
      title: t("web_ui.email_and_password_required"),
      message: () => t("web_ui.email_and_password_required_please_try_again"),
    },
    [EAuthenticationErrorCodes.ADMIN_AUTHENTICATION_FAILED]: {
      title: t("web_ui.authentication_failed"),
      message: () => t("web_ui.authentication_failed_please_try_again"),
    },
    [EAuthenticationErrorCodes.ADMIN_USER_ALREADY_EXIST]: {
      title: t("web_ui.admin_user_already_exists"),
      message: () => (
        <div>
          {t("web_ui.admin_user_already_exists_nbsp")}{" "}
          <Link className="font-medium underline underline-offset-4 transition-all hover:font-bold" href={`/admin`}>
            {t("web_ui.sign_in")}{" "}
          </Link>
          {t("web_ui.nbsp_now")}{" "}
        </div>
      ),
    },
    [EAuthenticationErrorCodes.ADMIN_USER_DOES_NOT_EXIST]: {
      title: t("web_ui.admin_user_does_not_exist"),
      message: () => (
        <div>
          {t("web_ui.admin_user_does_not_exist_nbsp")}{" "}
          <Link className="font-medium underline underline-offset-4 transition-all hover:font-bold" href={`/admin`}>
            {t("web_ui.sign_in")}{" "}
          </Link>
          {t("web_ui.nbsp_now")}{" "}
        </div>
      ),
    },
    [EAuthenticationErrorCodes.ADMIN_USER_DEACTIVATED]: {
      title: t("web_ui.admin_user_deactivated"),
      message: () => <div>{t("web_ui.your_account_is_deactivated")}</div>,
    },
    [EAuthenticationErrorCodes.RATE_LIMIT_EXCEEDED]: {
      title: "",
      message: () => t("web_ui.rate_limit_exceeded_please_try_again_later"),
    },
  };

  return errorCodeMessages;
}

export const authErrorHandler = (
  t: TTranslationStore["t"],
  errorCode: EAuthenticationErrorCodes,
  email?: string
): TAuthErrorInfo | undefined => {
  const errorCodeMessages = getErrorCodeMessages(t);
  const bannerAlertErrorCodes = [
    EAuthenticationErrorCodes.INSTANCE_NOT_CONFIGURED,
    EAuthenticationErrorCodes.INVALID_EMAIL,
    EAuthenticationErrorCodes.EMAIL_REQUIRED,
    EAuthenticationErrorCodes.SIGNUP_DISABLED,
    EAuthenticationErrorCodes.MAGIC_LINK_LOGIN_DISABLED,
    EAuthenticationErrorCodes.PASSWORD_LOGIN_DISABLED,
    EAuthenticationErrorCodes.BOT_USER_LOGIN_FORBIDDEN,
    EAuthenticationErrorCodes.USER_ACCOUNT_DEACTIVATED,
    EAuthenticationErrorCodes.INVALID_PASSWORD,
    EAuthenticationErrorCodes.SMTP_NOT_CONFIGURED,
    EAuthenticationErrorCodes.USER_ALREADY_EXIST,
    EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_UP,
    EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP,
    EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_UP,
    EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP,
    EAuthenticationErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED,
    EAuthenticationErrorCodes.USER_DOES_NOT_EXIST,
    EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_IN,
    EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN,
    EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_IN,
    EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN,
    EAuthenticationErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED,
    EAuthenticationErrorCodes.INVALID_MAGIC_CODE_SIGN_IN,
    EAuthenticationErrorCodes.INVALID_MAGIC_CODE_SIGN_UP,
    EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN,
    EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP,
    EAuthenticationErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN,
    EAuthenticationErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP,
    EAuthenticationErrorCodes.OAUTH_NOT_CONFIGURED,
    EAuthenticationErrorCodes.GOOGLE_NOT_CONFIGURED,
    EAuthenticationErrorCodes.GITHUB_NOT_CONFIGURED,
    EAuthenticationErrorCodes.GITLAB_NOT_CONFIGURED,
    EAuthenticationErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR,
    EAuthenticationErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR,
    EAuthenticationErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR,
    EAuthenticationErrorCodes.INVALID_PASSWORD_TOKEN,
    EAuthenticationErrorCodes.EXPIRED_PASSWORD_TOKEN,
    EAuthenticationErrorCodes.INCORRECT_OLD_PASSWORD,
    EAuthenticationErrorCodes.MISSING_PASSWORD,
    EAuthenticationErrorCodes.INVALID_NEW_PASSWORD,
    EAuthenticationErrorCodes.PASSWORD_ALREADY_SET,
    EAuthenticationErrorCodes.ADMIN_ALREADY_EXIST,
    EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME,
    EAuthenticationErrorCodes.INVALID_ADMIN_EMAIL,
    EAuthenticationErrorCodes.INVALID_ADMIN_PASSWORD,
    EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD,
    EAuthenticationErrorCodes.ADMIN_AUTHENTICATION_FAILED,
    EAuthenticationErrorCodes.ADMIN_USER_ALREADY_EXIST,
    EAuthenticationErrorCodes.ADMIN_USER_DOES_NOT_EXIST,
    EAuthenticationErrorCodes.ADMIN_USER_DEACTIVATED,
    EAuthenticationErrorCodes.RATE_LIMIT_EXCEEDED,
    EAuthenticationErrorCodes.PASSWORD_TOO_WEAK,
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

export const passwordErrors = [
  EAuthenticationErrorCodes.PASSWORD_TOO_WEAK,
  EAuthenticationErrorCodes.INVALID_NEW_PASSWORD,
];
