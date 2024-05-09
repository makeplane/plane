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
  INSTANCE_NOT_CONFIGURED = "5000",
  // Admin
  ADMIN_ALREADY_EXIST = "5029",
  REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME = "5030",
  INVALID_ADMIN_EMAIL = "5031",
  INVALID_ADMIN_PASSWORD = "5032",
  REQUIRED_ADMIN_EMAIL_PASSWORD = "5033",
  ADMIN_AUTHENTICATION_FAILED = "5034",
  ADMIN_USER_ALREADY_EXIST = "5035",
  ADMIN_USER_DOES_NOT_EXIST = "5036",
}

export enum EErrorAlertType {
  BANNER_ALERT = "BANNER_ALERT",
  TOAST_ALERT = "TOAST_ALERT",
  INLINE_FIRST_NAME = "INLINE_FIRST_NAME",
  INLINE_EMAIL = "INLINE_EMAIL",
  INLINE_PASSWORD = "INLINE_PASSWORD",
  INLINE_EMAIL_CODE = "INLINE_EMAIL_CODE",
}

export type TAuthErrorInfo = {
  type: EErrorAlertType;
  code: EAuthenticationErrorCodes;
  title: string;
  message: ReactNode;
};

const errorCodeMessages: {
  [key in EAuthenticationErrorCodes]: { title: string; message: (email?: string | undefined) => ReactNode };
} = {
  [EAuthenticationErrorCodes.INSTANCE_NOT_CONFIGURED]: {
    title: "Instance not configured",
    message: () => "Please contact your administrator to configure the instance.",
  },
  [EAuthenticationErrorCodes.ADMIN_ALREADY_EXIST]: {
    title: "Admin already exists",
    message: () => "Admin already exists. Please sign in.",
  },
  [EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME]: {
    title: "Required",
    message: () => "Please enter email, password and first name.",
  },
  [EAuthenticationErrorCodes.INVALID_ADMIN_EMAIL]: {
    title: "Invalid email",
    message: () => "Please enter a valid email.",
  },
  [EAuthenticationErrorCodes.INVALID_ADMIN_PASSWORD]: {
    title: "Invalid password",
    message: () => "Password must be at least 8 characters long.",
  },
  [EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD]: {
    title: "Required",
    message: () => "Please enter email and password.",
  },
  [EAuthenticationErrorCodes.ADMIN_AUTHENTICATION_FAILED]: {
    title: "Authentication failed",
    message: () => "Please check your email and password and try again.",
  },
  [EAuthenticationErrorCodes.ADMIN_USER_ALREADY_EXIST]: {
    title: "User already exists",
    message: () => "User already exists. Please sign in.",
  },
  [EAuthenticationErrorCodes.ADMIN_USER_DOES_NOT_EXIST]: {
    title: "User does not exist",
    message: () => "User does not exist. Please sign up.",
  },
};

export const authErrorHandler = (
  errorCode: EAuthenticationErrorCodes,
  email?: string | undefined
): TAuthErrorInfo | undefined => {
  const toastAlertErrorCodes = [
    EAuthenticationErrorCodes.ADMIN_ALREADY_EXIST,
    EAuthenticationErrorCodes.INVALID_ADMIN_EMAIL,
    EAuthenticationErrorCodes.INVALID_ADMIN_PASSWORD,
    EAuthenticationErrorCodes.ADMIN_AUTHENTICATION_FAILED,
  ];
  const bannerAlertErrorCodes = [
    EAuthenticationErrorCodes.INSTANCE_NOT_CONFIGURED,
    EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME,
    EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD,
    EAuthenticationErrorCodes.ADMIN_USER_ALREADY_EXIST,
    EAuthenticationErrorCodes.ADMIN_USER_DOES_NOT_EXIST,
  ];

  if (toastAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.TOAST_ALERT,
      code: errorCode,
      title: errorCodeMessages[errorCode]?.title || "Error",
      message: errorCodeMessages[errorCode]?.message(email) || "Something went wrong. Please try again.",
    };

  if (bannerAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.BANNER_ALERT,
      code: errorCode,
      title: errorCodeMessages[errorCode]?.title || "Error",
      message: errorCodeMessages[errorCode]?.message(email) || "Something went wrong. Please try again.",
    };

  return undefined;
};
