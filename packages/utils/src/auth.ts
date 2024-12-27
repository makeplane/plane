import { ReactNode } from "react";
import zxcvbn from "zxcvbn";
import {
  E_PASSWORD_STRENGTH,
  SPACE_PASSWORD_CRITERIA,
  PASSWORD_MIN_LENGTH,
  EErrorAlertType,
  EAuthErrorCodes,
} from "@plane/constants";

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
 * @description Password strength criteria type
 */
export type PasswordCriterion = {
  regex: RegExp;
  description: string;
};

/**
 * @description Password strength criteria
 */
export const PASSWORD_CRITERIA: PasswordCriterion[] = [
  { regex: /[a-z]/, description: "lowercase" },
  { regex: /[A-Z]/, description: "uppercase" },
  { regex: /[0-9]/, description: "number" },
  { regex: /[^a-zA-Z0-9]/, description: "special character" },
];

/**
 * @description Checks if password meets all criteria
 * @param {string} password - Password to check
 * @returns {boolean} Whether password meets all criteria
 */
export const checkPasswordCriteria = (password: string): boolean =>
  PASSWORD_CRITERIA.every((criterion) => criterion.regex.test(password));

/**
 * @description Checks password strength against criteria
 * @param {string} password - Password to check
 * @returns {PasswordStrength} Password strength level
 * @example
 * checkPasswordStrength("abc") // returns PasswordStrength.WEAK
 * checkPasswordStrength("Abc123!@#") // returns PasswordStrength.STRONG
 */
export const checkPasswordStrength = (password: string): PasswordStrength => {
  if (!password || password.length === 0) return PasswordStrength.EMPTY;
  if (password.length < PASSWORD_MIN_LENGTH) return PasswordStrength.WEAK;

  const criteriaCount = PASSWORD_CRITERIA.filter((criterion) => criterion.regex.test(password)).length;

  const zxcvbnScore = zxcvbn(password).score;

  if (criteriaCount <= 1 || zxcvbnScore <= 1) return PasswordStrength.WEAK;
  if (criteriaCount === 2 || zxcvbnScore === 2) return PasswordStrength.FAIR;
  if (criteriaCount === 3 || zxcvbnScore === 3) return PasswordStrength.GOOD;
  return PasswordStrength.STRONG;
};

export type TAuthErrorInfo = {
  type: EErrorAlertType;
  code: EAuthErrorCodes;
  title: string;
  message: ReactNode;
};

// Password strength check
export const getPasswordStrength = (password: string): E_PASSWORD_STRENGTH => {
  let passwordStrength: E_PASSWORD_STRENGTH = E_PASSWORD_STRENGTH.EMPTY;

  if (!password || password === "" || password.length <= 0) {
    return passwordStrength;
  }

  if (password.length >= PASSWORD_MIN_LENGTH) {
    passwordStrength = E_PASSWORD_STRENGTH.STRENGTH_NOT_VALID;
  } else {
    passwordStrength = E_PASSWORD_STRENGTH.LENGTH_NOT_VALID;
    return passwordStrength;
  }

  const passwordCriteriaValidation = SPACE_PASSWORD_CRITERIA.map((criteria) =>
    criteria.isCriteriaValid(password)
  ).every((criterion) => criterion);
  const passwordStrengthScore = zxcvbn(password).score;

  if (passwordCriteriaValidation === false || passwordStrengthScore <= 2) {
    passwordStrength = E_PASSWORD_STRENGTH.STRENGTH_NOT_VALID;
    return passwordStrength;
  }

  if (passwordCriteriaValidation === true && passwordStrengthScore >= 3) {
    passwordStrength = E_PASSWORD_STRENGTH.STRENGTH_VALID;
  }

  return passwordStrength;
};

// Error code messages
const errorCodeMessages: {
  [key in EAuthErrorCodes]: { title: string; message: (email?: string | undefined) => ReactNode };
} = {
  // global
  [EAuthErrorCodes.INSTANCE_NOT_CONFIGURED]: {
    title: `Instance not configured`,
    message: () => `Instance not configured. Please contact your administrator.`,
  },
  [EAuthErrorCodes.SIGNUP_DISABLED]: {
    title: `Sign up disabled`,
    message: () => `Sign up disabled. Please contact your administrator.`,
  },
  [EAuthErrorCodes.INVALID_PASSWORD]: {
    title: `Invalid password`,
    message: () => `Invalid password. Please try again.`,
  },
  [EAuthErrorCodes.SMTP_NOT_CONFIGURED]: {
    title: `SMTP not configured`,
    message: () => `SMTP not configured. Please contact your administrator.`,
  },
  // email check in both sign up and sign in
  [EAuthErrorCodes.INVALID_EMAIL]: {
    title: `Invalid email`,
    message: () => `Invalid email. Please try again.`,
  },
  [EAuthErrorCodes.EMAIL_REQUIRED]: {
    title: `Email required`,
    message: () => `Email required. Please try again.`,
  },
  // sign up
  [EAuthErrorCodes.USER_ALREADY_EXIST]: {
    title: `User already exists`,
    message: () => `Your account is already registered. Sign in now.`,
  },
  [EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP]: {
    title: `Email and password required`,
    message: () => `Email and password required. Please try again.`,
  },
  [EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_UP]: {
    title: `Authentication failed`,
    message: () => `Authentication failed. Please try again.`,
  },
  [EAuthErrorCodes.INVALID_EMAIL_SIGN_UP]: {
    title: `Invalid email`,
    message: () => `Invalid email. Please try again.`,
  },
  [EAuthErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED]: {
    title: `Email and code required`,
    message: () => `Email and code required. Please try again.`,
  },
  [EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP]: {
    title: `Invalid email`,
    message: () => `Invalid email. Please try again.`,
  },
  // sign in
  [EAuthErrorCodes.USER_ACCOUNT_DEACTIVATED]: {
    title: `User account deactivated`,
    message: () => `User account deactivated. Please contact administrator.`,
  },
  [EAuthErrorCodes.USER_DOES_NOT_EXIST]: {
    title: `User does not exist`,
    message: () => `No account found. Create one to get started.`,
  },
  [EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN]: {
    title: `Email and password required`,
    message: () => `Email and password required. Please try again.`,
  },
  [EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_IN]: {
    title: `Authentication failed`,
    message: () => `Authentication failed. Please try again.`,
  },
  [EAuthErrorCodes.INVALID_EMAIL_SIGN_IN]: {
    title: `Invalid email`,
    message: () => `Invalid email. Please try again.`,
  },
  [EAuthErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED]: {
    title: `Email and code required`,
    message: () => `Email and code required. Please try again.`,
  },
  [EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN]: {
    title: `Invalid email`,
    message: () => `Invalid email. Please try again.`,
  },
  // Both Sign in and Sign up
  [EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_IN]: {
    title: `Authentication failed`,
    message: () => `Invalid magic code. Please try again.`,
  },
  [EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_UP]: {
    title: `Authentication failed`,
    message: () => `Invalid magic code. Please try again.`,
  },
  [EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN]: {
    title: `Expired magic code`,
    message: () => `Expired magic code. Please try again.`,
  },
  [EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP]: {
    title: `Expired magic code`,
    message: () => `Expired magic code. Please try again.`,
  },
  [EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN]: {
    title: `Expired magic code`,
    message: () => `Expired magic code. Please try again.`,
  },
  [EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP]: {
    title: `Expired magic code`,
    message: () => `Expired magic code. Please try again.`,
  },
  // Oauth
  [EAuthErrorCodes.OAUTH_NOT_CONFIGURED]: {
    title: `OAuth not configured`,
    message: () => `OAuth not configured. Please contact your administrator.`,
  },
  [EAuthErrorCodes.GOOGLE_NOT_CONFIGURED]: {
    title: `Google not configured`,
    message: () => `Google not configured. Please contact your administrator.`,
  },
  [EAuthErrorCodes.GITHUB_NOT_CONFIGURED]: {
    title: `GitHub not configured`,
    message: () => `GitHub not configured. Please contact your administrator.`,
  },
  [EAuthErrorCodes.GITLAB_NOT_CONFIGURED]: {
    title: `GitLab not configured`,
    message: () => `GitLab not configured. Please contact your administrator.`,
  },
  [EAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR]: {
    title: `Google OAuth provider error`,
    message: () => `Google OAuth provider error. Please try again.`,
  },
  [EAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR]: {
    title: `GitHub OAuth provider error`,
    message: () => `GitHub OAuth provider error. Please try again.`,
  },
  [EAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR]: {
    title: `GitLab OAuth provider error`,
    message: () => `GitLab OAuth provider error. Please try again.`,
  },
  // Reset Password
  [EAuthErrorCodes.INVALID_PASSWORD_TOKEN]: {
    title: `Invalid password token`,
    message: () => `Invalid password token. Please try again.`,
  },
  [EAuthErrorCodes.EXPIRED_PASSWORD_TOKEN]: {
    title: `Expired password token`,
    message: () => `Expired password token. Please try again.`,
  },
  // Change password
  [EAuthErrorCodes.MISSING_PASSWORD]: {
    title: `Password required`,
    message: () => `Password required. Please try again.`,
  },
  [EAuthErrorCodes.INCORRECT_OLD_PASSWORD]: {
    title: `Incorrect old password`,
    message: () => `Incorrect old password. Please try again.`,
  },
  [EAuthErrorCodes.INVALID_NEW_PASSWORD]: {
    title: `Invalid new password`,
    message: () => `Invalid new password. Please try again.`,
  },
  // set password
  [EAuthErrorCodes.PASSWORD_ALREADY_SET]: {
    title: `Password already set`,
    message: () => `Password already set. Please try again.`,
  },
  // admin
  [EAuthErrorCodes.ADMIN_ALREADY_EXIST]: {
    title: `Admin already exists`,
    message: () => `Admin already exists. Please try again.`,
  },
  [EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME]: {
    title: `Email, password and first name required`,
    message: () => `Email, password and first name required. Please try again.`,
  },
  [EAuthErrorCodes.INVALID_ADMIN_EMAIL]: {
    title: `Invalid admin email`,
    message: () => `Invalid admin email. Please try again.`,
  },
  [EAuthErrorCodes.INVALID_ADMIN_PASSWORD]: {
    title: `Invalid admin password`,
    message: () => `Invalid admin password. Please try again.`,
  },
  [EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD]: {
    title: `Email and password required`,
    message: () => `Email and password required. Please try again.`,
  },
  [EAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED]: {
    title: `Authentication failed`,
    message: () => `Authentication failed. Please try again.`,
  },
  [EAuthErrorCodes.ADMIN_USER_ALREADY_EXIST]: {
    title: `Admin user already exists`,
    message: () => `Admin user already exists. Sign in now.`,
  },
  [EAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST]: {
    title: `Admin user does not exist`,
    message: () => `Admin user does not exist. Sign in now.`,
  },
  [EAuthErrorCodes.MAGIC_LINK_LOGIN_DISABLED]: {
    title: `Magic link login disabled`,
    message: () => `Magic link login is disabled. Please use password to login.`,
  },
  [EAuthErrorCodes.PASSWORD_LOGIN_DISABLED]: {
    title: `Password login disabled`,
    message: () => `Password login is disabled. Please use magic link to login.`,
  },
  [EAuthErrorCodes.ADMIN_USER_DEACTIVATED]: {
    title: `Admin user deactivated`,
    message: () => `Admin user account has been deactivated. Please contact administrator.`,
  },
  [EAuthErrorCodes.RATE_LIMIT_EXCEEDED]: {
    title: `Rate limit exceeded`,
    message: () => `Too many requests. Please try again later.`,
  },
};

// Error handler
export const authErrorHandler = (
  errorCode: EAuthErrorCodes,
  email?: string | undefined
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
    EAuthErrorCodes.USER_ACCOUNT_DEACTIVATED,
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
