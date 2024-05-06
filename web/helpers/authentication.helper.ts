import { ReactNode } from "react";

export enum EPageTypes {
  "PUBLIC" = "PUBLIC",
  "NON_AUTHENTICATED" = "NON_AUTHENTICATED",
  "ONBOARDING" = "ONBOARDING",
  "AUTHENTICATED" = "AUTHENTICATED",
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

export enum EAuthenticationErrorCodes {
  // alert errors
  INSTANCE_NOT_CONFIGURED = "INSTANCE_NOT_CONFIGURED",
  SMTP_NOT_CONFIGURED = "SMTP_NOT_CONFIGURED",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
  INVALID_TOKEN = "INVALID_TOKEN",
  EXPIRED_TOKEN = "EXPIRED_TOKEN",
  IMPROPERLY_CONFIGURED = "IMPROPERLY_CONFIGURED",
  OAUTH_PROVIDER_ERROR = "OAUTH_PROVIDER_ERROR",
  // banner errors
  INVALID_EMAIL = "INVALID_EMAIL",
  INVALID_PASSWORD = "INVALID_PASSWORD",
  USER_DOES_NOT_EXIST = "USER_DOES_NOT_EXIST",
  ADMIN_ALREADY_EXIST = "ADMIN_ALREADY_EXIST",
  USER_ALREADY_EXIST = "USER_ALREADY_EXIST",
  // inline errors from backend
  REQUIRED_EMAIL_PASSWORD_FIRST_NAME = "REQUIRED_EMAIL_PASSWORD_FIRST_NAME",
  REQUIRED_EMAIL_PASSWORD = "REQUIRED_EMAIL_PASSWORD",
  EMAIL_CODE_REQUIRED = "EMAIL_CODE_REQUIRED",
}

export enum EErrorAlertType {
  BANNER_ALERT = "BANNER_ALERT",
  TOAST_ALERT = "TOAST_ALERT",
  INLINE_FIRST_NAME = "INLINE_FIRST_NAME",
  INLINE_EMAIL = "INLINE_EMAIL",
  INLINE_PASSWORD = "INLINE_PASSWORD",
  INLINE_EMAIL_CODE = "INLINE_EMAIL_CODE",
}

export type TAuthErrorInfo = { type: EErrorAlertType; title: string; message: ReactNode };

const errorCodeMessages: { [key in EAuthenticationErrorCodes]: { title: string; message: ReactNode } } = {
  [EAuthenticationErrorCodes.INSTANCE_NOT_CONFIGURED]: {
    title: `Instance not configured`,
    message: `Instance not configured. Please contact your administrator.`,
  },
  [EAuthenticationErrorCodes.SMTP_NOT_CONFIGURED]: {
    title: `SMTP not configured`,
    message: `SMTP not configured. Please contact your administrator.`,
  },
  [EAuthenticationErrorCodes.AUTHENTICATION_FAILED]: {
    title: `Authentication failed.`,
    message: `Authentication failed. Please try again.`,
  },
  [EAuthenticationErrorCodes.INVALID_TOKEN]: { title: `Invalid token.`, message: `Invalid token. Please try again.` },
  [EAuthenticationErrorCodes.EXPIRED_TOKEN]: { title: `Expired token.`, message: `Expired token. Please try again.` },
  [EAuthenticationErrorCodes.IMPROPERLY_CONFIGURED]: {
    title: `Improperly configured.`,
    message: `Improperly configured. Please contact your administrator.`,
  },
  [EAuthenticationErrorCodes.OAUTH_PROVIDER_ERROR]: {
    title: `OAuth provider error.`,
    message: `OAuth provider error. Please try again.`,
  },
  [EAuthenticationErrorCodes.INVALID_EMAIL]: {
    title: `Invalid email.`,
    message: `Invalid email. Please try again.`,
  },
  [EAuthenticationErrorCodes.INVALID_PASSWORD]: {
    title: `Invalid password.`,
    message: `Invalid password. Please try again.`,
  },
  [EAuthenticationErrorCodes.USER_DOES_NOT_EXIST]: {
    title: `User does not exist.`,
    message: `User does not exist. Please try again.`,
  },
  [EAuthenticationErrorCodes.ADMIN_ALREADY_EXIST]: {
    title: `Admin already exists.`,
    message: `Admin already exists. Please try again.`,
  },
  [EAuthenticationErrorCodes.USER_ALREADY_EXIST]: {
    title: `User already exists.`,
    message: `User already exists. Please try again.`,
  },
  [EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_FIRST_NAME]: {
    title: `Missing fields.`,
    message: `Email, password, and first name are required.`,
  },
  [EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD]: {
    title: `Missing fields.`,
    message: `Email and password are required.`,
  },
  [EAuthenticationErrorCodes.EMAIL_CODE_REQUIRED]: {
    title: `Missing fields.`,
    message: `Email and code are required.`,
  },
};

export const authErrorHandler = (
  errorCode: EAuthenticationErrorCodes,
  errorMessage: string | undefined
): TAuthErrorInfo | undefined => {
  const toastAlertErrorCodes = [
    EAuthenticationErrorCodes.INSTANCE_NOT_CONFIGURED,
    EAuthenticationErrorCodes.SMTP_NOT_CONFIGURED,
    EAuthenticationErrorCodes.AUTHENTICATION_FAILED,
    EAuthenticationErrorCodes.INVALID_TOKEN,
    EAuthenticationErrorCodes.EXPIRED_TOKEN,
    EAuthenticationErrorCodes.IMPROPERLY_CONFIGURED,
    EAuthenticationErrorCodes.OAUTH_PROVIDER_ERROR,
  ];
  const bannerAlertErrorCodes = [
    EAuthenticationErrorCodes.INVALID_EMAIL,
    EAuthenticationErrorCodes.INVALID_PASSWORD,
    EAuthenticationErrorCodes.USER_DOES_NOT_EXIST,
    EAuthenticationErrorCodes.ADMIN_ALREADY_EXIST,
    EAuthenticationErrorCodes.USER_ALREADY_EXIST,
    EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_FIRST_NAME,
    EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD,
    EAuthenticationErrorCodes.EMAIL_CODE_REQUIRED,
  ];

  if (toastAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.TOAST_ALERT,
      title: errorCodeMessages[errorCode]?.title || "Error",
      message: errorMessage || errorCodeMessages[errorCode]?.message || "Something went wrong. Please try again.",
    };

  if (bannerAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.BANNER_ALERT,
      title: errorCodeMessages[errorCode]?.title || "Error",
      message: errorMessage || errorCodeMessages[errorCode]?.message || "Something went wrong. Please try again.",
    };

  return undefined;
};
