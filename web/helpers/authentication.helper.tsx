import { ReactNode } from "react";
import Link from "next/link";

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
  SIGNUP_DISABLED = "5001",
  INVALID_PASSWORD = "5002",
  USER_ALREADY_EXIST = "5003",
  USER_DOES_NOT_EXIST = "5004",
  AUTHENTICATION_FAILED_SIGN_IN = "5005",
  AUTHENTICATION_FAILED_SIGN_UP = "5006",
  SMTP_NOT_CONFIGURED = "5007",
  INVALID_MAGIC_CODE = "5008",
  EXPIRED_MAGIC_CODE = "5009",
  GOOGLE_NOT_CONFIGURED = "5010",
  GITHUB_NOT_CONFIGURED = "5011",
  INVALID_EMAIL = "5012",
  EMAIL_REQUIRED = "5013",
  REQUIRED_EMAIL_PASSWORD_SIGN_IN = "5014",
  INVALID_EMAIL_SIGN_IN = "5015",
  INVALID_EMAIL_SIGN_UP = "5016",
  INVALID_EMAIL_MAGIC_SIGN_IN = "5017",
  INVALID_EMAIL_MAGIC_SIGN_UP = "5018",
  GITHUB_OAUTH_PROVIDER_ERROR = "5019",
  GOOGLE_OAUTH_PROVIDER_ERROR = "5020",
  MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED = "5021",
  MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED = "5022",
  INVALID_PASSWORD_TOKEN = "5023",
  EXPIRED_PASSWORD_TOKEN = "5024",
  INCORRECT_OLD_PASSWORD = "5025",
  INVALID_NEW_PASSWORD = "5026",
  PASSWORD_ALREADY_SET = "5027",
  ADMIN_ALREADY_EXIST = "5028",
  REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME = "5029",
  INVALID_ADMIN_EMAIL = "5030",
  INVALID_ADMIN_PASSWORD = "5031",
  REQUIRED_ADMIN_EMAIL_PASSWORD = "5032",
  ADMIN_AUTHENTICATION_FAILED = "5034",
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

const errorCodeMessages: { [key in EAuthenticationErrorCodes]: { title: string; message: ReactNode } } = {
  [EAuthenticationErrorCodes.INSTANCE_NOT_CONFIGURED]: {
    title: `Instance not configured`,
    message: `Instance not configured. Please contact your administrator.`,
  },
  [EAuthenticationErrorCodes.SIGNUP_DISABLED]: {
    title: `Sign up disabled`,
    message: `Sign up disabled. Please contact your administrator.`,
  },
  [EAuthenticationErrorCodes.INVALID_PASSWORD]: {
    title: `Invalid password`,
    message: `Invalid password. Please try again.`,
  },
  [EAuthenticationErrorCodes.USER_ALREADY_EXIST]: {
    title: `User already exists`,
    message: (
      <div>
        Your account is already registered.&nbsp;
        <Link
          className="underline underline-offset-4 font-medium hover:font-bold transition-all"
          href={`/accounts/sign-in`}
        >
          Sign In
        </Link>
        &nbsp;now.
      </div>
    ),
  },
  [EAuthenticationErrorCodes.USER_DOES_NOT_EXIST]: {
    title: `User does not exist`,
    message: (
      <div>
        No account found.&nbsp;
        <Link className="underline underline-offset-4 font-medium hover:font-bold transition-all" href={`/`}>
          Create one
        </Link>
        &nbsp;to get started.
      </div>
    ),
  },
  [EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_IN]: {
    title: `Authentication failed`,
    message: `Authentication failed. Please try again.`,
  },
  [EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_UP]: {
    title: `Authentication failed`,
    message: `Authentication failed. Please try again.`,
  },
  [EAuthenticationErrorCodes.SMTP_NOT_CONFIGURED]: {
    title: `SMTP not configured`,
    message: `SMTP not configured. Please contact your administrator.`,
  },
  [EAuthenticationErrorCodes.INVALID_MAGIC_CODE]: {
    title: `Authentication failed`,
    message: `Invalid magic code. Please try again.`,
  },
  [EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE]: {
    title: `Expired magic code`,
    message: `Expired magic code. Please try again.`,
  },
  [EAuthenticationErrorCodes.GOOGLE_NOT_CONFIGURED]: {
    title: `Google not configured`,
    message: `Google not configured. Please contact your administrator.`,
  },
  [EAuthenticationErrorCodes.GITHUB_NOT_CONFIGURED]: {
    title: `GitHub not configured`,
    message: `GitHub not configured. Please contact your administrator.`,
  },
  [EAuthenticationErrorCodes.INVALID_EMAIL]: {
    title: `Invalid email`,
    message: `Invalid email. Please try again.`,
  },
  [EAuthenticationErrorCodes.EMAIL_REQUIRED]: {
    title: `Email required`,
    message: `Email required. Please try again.`,
  },
  [EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN]: {
    title: `Email and password required`,
    message: `Email and password required. Please try again.`,
  },
  [EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_IN]: {
    title: `Invalid email`,
    message: `Invalid email. Please try again.`,
  },
  [EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_UP]: {
    title: `Invalid email`,
    message: `Invalid email. Please try again.`,
  },
  [EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN]: {
    title: `Invalid email`,
    message: `Invalid email. Please try again.`,
  },
  [EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP]: {
    title: `Invalid email`,
    message: `Invalid email. Please try again.`,
  },
  [EAuthenticationErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR]: {
    title: `GitHub OAuth provider error`,
    message: `GitHub OAuth provider error. Please try again.`,
  },
  [EAuthenticationErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR]: {
    title: `Google OAuth provider error`,
    message: `Google OAuth provider error. Please try again.`,
  },
  [EAuthenticationErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED]: {
    title: `Email and code required`,
    message: `Email and code required. Please try again.`,
  },
  [EAuthenticationErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED]: {
    title: `Email and code required`,
    message: `Email and code required. Please try again.`,
  },
  [EAuthenticationErrorCodes.INVALID_PASSWORD_TOKEN]: {
    title: `Invalid password token`,
    message: `Invalid password token. Please try again.`,
  },
  [EAuthenticationErrorCodes.EXPIRED_PASSWORD_TOKEN]: {
    title: `Expired password token`,
    message: `Expired password token. Please try again.`,
  },
  [EAuthenticationErrorCodes.INCORRECT_OLD_PASSWORD]: {
    title: `Incorrect old password`,
    message: `Incorrect old password. Please try again.`,
  },
  [EAuthenticationErrorCodes.INVALID_NEW_PASSWORD]: {
    title: `Invalid new password`,
    message: `Invalid new password. Please try again.`,
  },
  [EAuthenticationErrorCodes.PASSWORD_ALREADY_SET]: {
    title: `Password already set`,
    message: `Password already set. Please try again.`,
  },
  [EAuthenticationErrorCodes.ADMIN_ALREADY_EXIST]: {
    title: `Admin already exists`,
    message: `Admin already exists. Please try again.`,
  },
  [EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME]: {
    title: `Email, password and first name required`,
    message: `Email, password and first name required. Please try again.`,
  },
  [EAuthenticationErrorCodes.INVALID_ADMIN_EMAIL]: {
    title: `Invalid email`,
    message: `Invalid email. Please try again.`,
  },
  [EAuthenticationErrorCodes.INVALID_ADMIN_PASSWORD]: {
    title: `Invalid password`,
    message: `Invalid password. Please try again.`,
  },
  [EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD]: {
    title: `Email and password required`,
    message: `Email and password required. Please try again.`,
  },
  [EAuthenticationErrorCodes.ADMIN_AUTHENTICATION_FAILED]: {
    title: `Authentication failed`,
    message: `Authentication failed. Please try again.`,
  },
};

export const authErrorHandler = (errorCode: EAuthenticationErrorCodes): TAuthErrorInfo | undefined => {
  const toastAlertErrorCodes = [
    EAuthenticationErrorCodes.INSTANCE_NOT_CONFIGURED,
    EAuthenticationErrorCodes.SIGNUP_DISABLED,
    EAuthenticationErrorCodes.INVALID_PASSWORD,
    EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_IN,
    EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_UP,
    EAuthenticationErrorCodes.SMTP_NOT_CONFIGURED,
    EAuthenticationErrorCodes.INVALID_MAGIC_CODE,
    EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE,
    EAuthenticationErrorCodes.GOOGLE_NOT_CONFIGURED,
    EAuthenticationErrorCodes.GITHUB_NOT_CONFIGURED,
    EAuthenticationErrorCodes.INVALID_EMAIL,
    EAuthenticationErrorCodes.EMAIL_REQUIRED,
    EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN,
    EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_IN,
    EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_UP,
    EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN,
    EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP,
    EAuthenticationErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR,
    EAuthenticationErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR,
    EAuthenticationErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED,
    EAuthenticationErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED,
    EAuthenticationErrorCodes.INVALID_PASSWORD_TOKEN,
    EAuthenticationErrorCodes.EXPIRED_PASSWORD_TOKEN,
    EAuthenticationErrorCodes.INCORRECT_OLD_PASSWORD,
    EAuthenticationErrorCodes.INVALID_NEW_PASSWORD,
    EAuthenticationErrorCodes.PASSWORD_ALREADY_SET,
    EAuthenticationErrorCodes.ADMIN_ALREADY_EXIST,
    EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME,
    EAuthenticationErrorCodes.INVALID_ADMIN_EMAIL,
    EAuthenticationErrorCodes.INVALID_ADMIN_PASSWORD,
    EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD,
    EAuthenticationErrorCodes.ADMIN_AUTHENTICATION_FAILED,
  ];
  const bannerAlertErrorCodes = [
    EAuthenticationErrorCodes.USER_ALREADY_EXIST,
    EAuthenticationErrorCodes.USER_DOES_NOT_EXIST,
  ];

  if (toastAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.TOAST_ALERT,
      code: errorCode,
      title: errorCodeMessages[errorCode]?.title || "Error",
      message: errorCodeMessages[errorCode]?.message || "Something went wrong. Please try again.",
    };

  if (bannerAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.BANNER_ALERT,
      code: errorCode,
      title: errorCodeMessages[errorCode]?.title || "Error",
      message: errorCodeMessages[errorCode]?.message || "Something went wrong. Please try again.",
    };

  return undefined;
};
