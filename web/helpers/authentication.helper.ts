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
  // inline local errors
  INLINE_EMAIL = "INLINE_EMAIL",
  INLINE_PASSWORD = "INLINE_PASSWORD",
  INLINE_FIRST_NAME = "INLINE_FIRST_NAME",
  INLINE_EMAIL_CODE = "INLINE_EMAIL_CODE",
}

export enum EErrorAlertType {
  BANNER_ALERT = "BANNER_ALERT",
  TOAST_ALERT = "TOAST_ALERT",
  INLINE_FIRST_NAME = "INLINE_FIRST_NAME",
  INLINE_EMAIL = "INLINE_EMAIL",
  INLINE_PASSWORD = "INLINE_PASSWORD",
  INLINE_EMAIL_CODE = "INLINE_EMAIL_CODE",
}

export type TAuthErrorInfo = { type: EErrorAlertType; message: string };

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
    EAuthenticationErrorCodes.USER_DOES_NOT_EXIST,
    EAuthenticationErrorCodes.ADMIN_ALREADY_EXIST,
    EAuthenticationErrorCodes.USER_ALREADY_EXIST,
  ];
  const inlineFirstNameErrorCodes = [EAuthenticationErrorCodes.INLINE_FIRST_NAME];
  const inlineEmailErrorCodes = [EAuthenticationErrorCodes.INLINE_EMAIL];
  const inlineEmailCodeErrorCodes = [EAuthenticationErrorCodes.INLINE_EMAIL_CODE];
  const inlinePasswordErrorCodes = [EAuthenticationErrorCodes.INLINE_PASSWORD];

  if (toastAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.TOAST_ALERT,
      message: errorMessage || "Something went wrong. Please try again.",
    };

  if (bannerAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.BANNER_ALERT,
      message: errorMessage || "Something went wrong. Please try again.",
    };

  if (inlineFirstNameErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.INLINE_FIRST_NAME,
      message: errorMessage || "Something went wrong. Please try again.",
    };

  if (inlineEmailErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.INLINE_EMAIL,
      message: errorMessage || "Something went wrong. Please try again.",
    };

  if (inlinePasswordErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.INLINE_PASSWORD,
      message: errorMessage || "Something went wrong. Please try again.",
    };

  if (inlineEmailCodeErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.INLINE_EMAIL_CODE,
      message: errorMessage || "Something went wrong. Please try again.",
    };

  return undefined;
};
