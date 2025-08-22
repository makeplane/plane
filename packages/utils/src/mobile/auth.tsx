import { ReactNode } from "react";
import {
  TMobileAuthErrorCodes,
  TMobileAuthErrorInfo,
  EMobileAuthErrorCodes,
  EMobileErrorAlertType,
  SUPPORT_EMAIL,
} from "@plane/constants";

const mobileAuthErrorCodeMessages: {
  [key in TMobileAuthErrorCodes]: { title: string; message: (email?: string | undefined) => ReactNode };
} = {
  // global
  [EMobileAuthErrorCodes.INSTANCE_NOT_CONFIGURED]: {
    title: `Instance not configured`,
    message: () => `Instance not configured. Please contact your administrator.`,
  },
  [EMobileAuthErrorCodes.INVALID_EMAIL]: {
    title: `Invalid email`,
    message: () => `Invalid email. Please try again.`,
  },
  [EMobileAuthErrorCodes.EMAIL_REQUIRED]: {
    title: `Email required`,
    message: () => `Email required. Please try again.`,
  },
  [EMobileAuthErrorCodes.SIGNUP_DISABLED]: {
    title: `Sign up disabled`,
    message: () => `Sign up disabled. Please contact your administrator.`,
  },
  [EMobileAuthErrorCodes.MAGIC_LINK_LOGIN_DISABLED]: {
    title: `Magic link login disabled`,
    message: () => `Magic link login disabled. Please contact your administrator.`,
  },
  [EMobileAuthErrorCodes.PASSWORD_LOGIN_DISABLED]: {
    title: `Password login disabled`,
    message: () => `Password login disabled. Please contact your administrator.`,
  },
  [EMobileAuthErrorCodes.USER_ACCOUNT_DEACTIVATED]: {
    title: `User account deactivated`,
    message: () => `User account deactivated. Please contact ${!!SUPPORT_EMAIL ? SUPPORT_EMAIL : "administrator"}.`,
  },
  [EMobileAuthErrorCodes.INVALID_PASSWORD]: {
    title: `Invalid password`,
    message: () => `Invalid password. Please try again.`,
  },
  [EMobileAuthErrorCodes.SMTP_NOT_CONFIGURED]: {
    title: `SMTP not configured`,
    message: () => `SMTP not configured. Please contact your administrator.`,
  },

  // sign up
  [EMobileAuthErrorCodes.USER_ALREADY_EXIST]: {
    title: `User already exists`,
    message: () => `Your account is already registered. Please try again.`,
  },
  [EMobileAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP]: {
    title: `Email and password required`,
    message: () => `Email and password required. Please try again.`,
  },
  [EMobileAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_UP]: {
    title: `Authentication failed`,
    message: () => `Authentication failed. Please try again.`,
  },
  [EMobileAuthErrorCodes.INVALID_EMAIL_SIGN_UP]: {
    title: `Invalid email`,
    message: () => `Invalid email. Please try again.`,
  },
  [EMobileAuthErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED]: {
    title: `Email and code required`,
    message: () => `Email and code required. Please try again.`,
  },
  [EMobileAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP]: {
    title: `Invalid email`,
    message: () => `Invalid email. Please try again.`,
  },

  [EMobileAuthErrorCodes.USER_DOES_NOT_EXIST]: {
    title: `User does not exist`,
    message: () => `No account found. Please try again.`,
  },
  [EMobileAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN]: {
    title: `Email and password required`,
    message: () => `Email and password required. Please try again.`,
  },
  [EMobileAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_IN]: {
    title: `Authentication failed`,
    message: () => `Authentication failed. Please try again.`,
  },
  [EMobileAuthErrorCodes.INVALID_EMAIL_SIGN_IN]: {
    title: `Invalid email`,
    message: () => `Invalid email. Please try again.`,
  },
  [EMobileAuthErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED]: {
    title: `Email and code required`,
    message: () => `Email and code required. Please try again.`,
  },
  [EMobileAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN]: {
    title: `Invalid email`,
    message: () => `Invalid email. Please try again.`,
  },

  // Both Sign in and Sign up
  [EMobileAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_IN]: {
    title: `Authentication failed`,
    message: () => `Invalid magic code. Please try again.`,
  },
  [EMobileAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_UP]: {
    title: `Authentication failed`,
    message: () => `Invalid magic code. Please try again.`,
  },
  [EMobileAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN]: {
    title: `Expired magic code`,
    message: () => `Expired magic code. Please try again.`,
  },
  [EMobileAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP]: {
    title: `Expired magic code`,
    message: () => `Expired magic code. Please try again.`,
  },
  [EMobileAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN]: {
    title: `Expired magic code`,
    message: () => `Expired magic code. Please try again.`,
  },
  [EMobileAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP]: {
    title: `Expired magic code`,
    message: () => `Expired magic code. Please try again.`,
  },

  // Oauth
  [EMobileAuthErrorCodes.OAUTH_NOT_CONFIGURED]: {
    title: `OAuth not configured`,
    message: () => `OAuth not configured. Please contact your administrator.`,
  },
  [EMobileAuthErrorCodes.GOOGLE_NOT_CONFIGURED]: {
    title: `Google not configured`,
    message: () => `Google not configured. Please contact your administrator.`,
  },
  [EMobileAuthErrorCodes.GITHUB_NOT_CONFIGURED]: {
    title: `GitHub not configured`,
    message: () => `GitHub not configured. Please contact your administrator.`,
  },
  [EMobileAuthErrorCodes.GITLAB_NOT_CONFIGURED]: {
    title: `GitLab not configured`,
    message: () => `GitLab not configured. Please contact your administrator.`,
  },
  [EMobileAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR]: {
    title: `Google OAuth provider error`,
    message: () => `Google OAuth provider error. Please try again.`,
  },
  [EMobileAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR]: {
    title: `GitHub OAuth provider error`,
    message: () => `GitHub OAuth provider error. Please try again.`,
  },
  [EMobileAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR]: {
    title: `GitLab OAuth provider error`,
    message: () => `GitLab OAuth provider error. Please try again.`,
  },

  // Reset Password
  [EMobileAuthErrorCodes.INVALID_PASSWORD_TOKEN]: {
    title: `Invalid password token`,
    message: () => `Invalid password token.`,
  },
  [EMobileAuthErrorCodes.EXPIRED_PASSWORD_TOKEN]: {
    title: `Expired password token`,
    message: () => `Expired password token. Please try again.`,
  },

  // Change password
  [EMobileAuthErrorCodes.MISSING_PASSWORD]: {
    title: `Password required`,
    message: () => `Password required. Please try again.`,
  },
  [EMobileAuthErrorCodes.INCORRECT_OLD_PASSWORD]: {
    title: `Incorrect old password`,
    message: () => `Incorrect old password. Please try again.`,
  },
  [EMobileAuthErrorCodes.INVALID_NEW_PASSWORD]: {
    title: `Invalid new password`,
    message: () => `Invalid new password. Please try again.`,
  },

  // set password
  [EMobileAuthErrorCodes.PASSWORD_ALREADY_SET]: {
    title: `Password already set`,
    message: () => `Password already set. Please try again.`,
  },

  // admin
  [EMobileAuthErrorCodes.ADMIN_ALREADY_EXIST]: {
    title: `Admin already exists`,
    message: () => `Admin already exists. Please try again.`,
  },
  [EMobileAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME]: {
    title: `Email, password and first name required`,
    message: () => `Email, password and first name required. Please try again.`,
  },
  [EMobileAuthErrorCodes.INVALID_ADMIN_EMAIL]: {
    title: `Invalid admin email`,
    message: () => `Invalid admin email. Please try again.`,
  },
  [EMobileAuthErrorCodes.INVALID_ADMIN_PASSWORD]: {
    title: `Invalid admin password`,
    message: () => `Invalid admin password. Please try again.`,
  },
  [EMobileAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD]: {
    title: `Email and password required`,
    message: () => `Email and password required. Please try again.`,
  },
  [EMobileAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED]: {
    title: `Authentication failed`,
    message: () => `Authentication failed. Please try again.`,
  },
  [EMobileAuthErrorCodes.ADMIN_USER_ALREADY_EXIST]: {
    title: `Admin user already exists`,
    message: () => `Admin user already exists. Please try again.`,
  },
  [EMobileAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST]: {
    title: `Admin user does not exist`,
    message: () => `Admin user does not exist. Please try again.`,
  },
  [EMobileAuthErrorCodes.ADMIN_USER_DEACTIVATED]: {
    title: `Admin user deactivated`,
    message: () => `Your account is deactivated`,
  },
  [EMobileAuthErrorCodes.RATE_LIMIT_EXCEEDED]: {
    title: "",
    message: () => `Rate limit exceeded. Please try again later.`,
  },

  // mobile specific codes
  [EMobileAuthErrorCodes.USER_NOT_ONBOARDED]: {
    title: `User not onboarded`,
    message: () => `User not onboarded. Please try again.`,
  },
  [EMobileAuthErrorCodes.TOKEN_NOT_SET]: {
    title: `Token not set`,
    message: () => `Token not set. Please try again.`,
  },
  [EMobileAuthErrorCodes.MOBILE_SIGNUP_DISABLED]: {
    title: `Mobile sign up disabled`,
    message: () => `Mobile sign up disabled. Please contact your administrator.`,
  },
};

export const mobileAuthErrorHandler = (
  errorCode: TMobileAuthErrorCodes,
  email?: string | undefined
): TMobileAuthErrorInfo | undefined => {
  const bannerAlertErrorCodes = [
    EMobileAuthErrorCodes.INSTANCE_NOT_CONFIGURED,
    EMobileAuthErrorCodes.INVALID_EMAIL,
    EMobileAuthErrorCodes.EMAIL_REQUIRED,
    EMobileAuthErrorCodes.SIGNUP_DISABLED,
    EMobileAuthErrorCodes.MAGIC_LINK_LOGIN_DISABLED,
    EMobileAuthErrorCodes.PASSWORD_LOGIN_DISABLED,
    EMobileAuthErrorCodes.USER_ACCOUNT_DEACTIVATED,
    EMobileAuthErrorCodes.INVALID_PASSWORD,
    EMobileAuthErrorCodes.SMTP_NOT_CONFIGURED,
    EMobileAuthErrorCodes.USER_ALREADY_EXIST,
    EMobileAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_UP,
    EMobileAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP,
    EMobileAuthErrorCodes.INVALID_EMAIL_SIGN_UP,
    EMobileAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP,
    EMobileAuthErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED,
    EMobileAuthErrorCodes.USER_DOES_NOT_EXIST,
    EMobileAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_IN,
    EMobileAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN,
    EMobileAuthErrorCodes.INVALID_EMAIL_SIGN_IN,
    EMobileAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN,
    EMobileAuthErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED,
    EMobileAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_IN,
    EMobileAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_UP,
    EMobileAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN,
    EMobileAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP,
    EMobileAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN,
    EMobileAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP,
    EMobileAuthErrorCodes.OAUTH_NOT_CONFIGURED,
    EMobileAuthErrorCodes.GOOGLE_NOT_CONFIGURED,
    EMobileAuthErrorCodes.GITHUB_NOT_CONFIGURED,
    EMobileAuthErrorCodes.GITLAB_NOT_CONFIGURED,
    EMobileAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR,
    EMobileAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR,
    EMobileAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR,
    EMobileAuthErrorCodes.INVALID_PASSWORD_TOKEN,
    EMobileAuthErrorCodes.EXPIRED_PASSWORD_TOKEN,
    EMobileAuthErrorCodes.INCORRECT_OLD_PASSWORD,
    EMobileAuthErrorCodes.MISSING_PASSWORD,
    EMobileAuthErrorCodes.INVALID_NEW_PASSWORD,
    EMobileAuthErrorCodes.PASSWORD_ALREADY_SET,
    EMobileAuthErrorCodes.ADMIN_ALREADY_EXIST,
    EMobileAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME,
    EMobileAuthErrorCodes.INVALID_ADMIN_EMAIL,
    EMobileAuthErrorCodes.INVALID_ADMIN_PASSWORD,
    EMobileAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD,
    EMobileAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED,
    EMobileAuthErrorCodes.ADMIN_USER_ALREADY_EXIST,
    EMobileAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST,
    EMobileAuthErrorCodes.ADMIN_USER_DEACTIVATED,
    EMobileAuthErrorCodes.RATE_LIMIT_EXCEEDED,
    EMobileAuthErrorCodes.USER_NOT_ONBOARDED,
    EMobileAuthErrorCodes.TOKEN_NOT_SET,
    EMobileAuthErrorCodes.MOBILE_SIGNUP_DISABLED,
  ];

  if (bannerAlertErrorCodes.includes(errorCode))
    return {
      type: EMobileErrorAlertType.BANNER_ALERT,
      code: errorCode,
      title: mobileAuthErrorCodeMessages[errorCode]?.title || "Error",
      message: mobileAuthErrorCodeMessages[errorCode]?.message(email) || "Something went wrong. Please try again.",
    };

  return undefined;
};
