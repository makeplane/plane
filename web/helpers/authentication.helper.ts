export enum ESignUpEMailCheck {
  INSTANCE_NOT_CONFIGURED = "INSTANCE_NOT_CONFIGURED",
  USER_ALREADY_EXIST = "USER_ALREADY_EXIST",
}

export enum ESignUp {
  INSTANCE_NOT_CONFIGURED = "INSTANCE_NOT_CONFIGURED",
  REQUIRED_EMAIL_PASSWORD = "REQUIRED_EMAIL_PASSWORD",
  INVALID_EMAIL = "INVALID_EMAIL",
  USER_ALREADY_EXIST = "USER_ALREADY_EXIST",
}

export enum ESignInEMailCheck {
  INSTANCE_NOT_CONFIGURED = "INSTANCE_NOT_CONFIGURED",
  REQUIRED_EMAIL_PASSWORD = "REQUIRED_EMAIL_PASSWORD",
  INVALID_EMAIL = "INVALID_EMAIL",
  USER_ALREADY_EXIST = "USER_ALREADY_EXIST",
}

export enum ESignIn {
  INSTANCE_NOT_CONFIGURED = "INSTANCE_NOT_CONFIGURED",
  REQUIRED_EMAIL_PASSWORD = "REQUIRED_EMAIL_PASSWORD",
  INVALID_EMAIL = "INVALID_EMAIL",
  USER_ALREADY_EXIST = "USER_ALREADY_EXIST",
}

export type TErrorTypes = ESignUpEMailCheck | ESignUp | ESignInEMailCheck | ESignIn;

export enum EErrorAlertType {
  BANNER_ALERT = "BANNER_ALERT",
  TOAST_ALERT = "TOAST_ALERT",
  INLINE_FIRST_NAME = "INLINE_FIRST_NAME",
  INLINE_EMAIL = "INLINE_EMAIL",
  INLINE_PASSWORD = "INLINE_PASSWORD",
}

export const errorHandler = (
  errorType: TErrorTypes,
  errorMessage: string | undefined
): { type: EErrorAlertType | undefined; message: string | undefined } => {
  const errorPayload = {
    type: undefined,
    message: errorMessage || undefined,
  };
  const signUpErrorTypes = [""];
  const signInErrorTypes = [""];

  console.log("errorType", errorType);
  console.log("signUpErrorTypes", signUpErrorTypes);
  console.log("signInErrorTypes", signInErrorTypes);

  return errorPayload;
};
