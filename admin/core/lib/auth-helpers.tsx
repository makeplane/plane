import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { KeyRound, Mails } from "lucide-react";
// plane packages
import { SUPPORT_EMAIL, EAdminAuthErrorCodes, TAuthErrorInfo } from "@plane/constants";
import { TGetBaseAuthenticationModeProps, TInstanceAuthenticationModes } from "@plane/types";
import { resolveGeneralTheme } from "@plane/utils";
// components
import {
  EmailCodesConfiguration,
  GithubConfiguration,
  GitlabConfiguration,
  GoogleConfiguration,
  PasswordLoginConfiguration,
} from "@/components/authentication";
// images
import githubLightModeImage from "@/public/logos/github-black.png";
import githubDarkModeImage from "@/public/logos/github-white.png";
import GitlabLogo from "@/public/logos/gitlab-logo.svg";
import GoogleLogo from "@/public/logos/google-logo.svg";

export enum EErrorAlertType {
  BANNER_ALERT = "BANNER_ALERT",
  INLINE_FIRST_NAME = "INLINE_FIRST_NAME",
  INLINE_EMAIL = "INLINE_EMAIL",
  INLINE_PASSWORD = "INLINE_PASSWORD",
  INLINE_EMAIL_CODE = "INLINE_EMAIL_CODE",
}

const errorCodeMessages: {
  [key in EAdminAuthErrorCodes]: { title: string; message: (email?: string | undefined) => ReactNode };
} = {
  // admin
  [EAdminAuthErrorCodes.ADMIN_ALREADY_EXIST]: {
    title: `Admin already exists`,
    message: () => `Admin already exists. Please try again.`,
  },
  [EAdminAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME]: {
    title: `Email, password and first name required`,
    message: () => `Email, password and first name required. Please try again.`,
  },
  [EAdminAuthErrorCodes.INVALID_ADMIN_EMAIL]: {
    title: `Invalid admin email`,
    message: () => `Invalid admin email. Please try again.`,
  },
  [EAdminAuthErrorCodes.INVALID_ADMIN_PASSWORD]: {
    title: `Invalid admin password`,
    message: () => `Invalid admin password. Please try again.`,
  },
  [EAdminAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD]: {
    title: `Email and password required`,
    message: () => `Email and password required. Please try again.`,
  },
  [EAdminAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED]: {
    title: `Authentication failed`,
    message: () => `Authentication failed. Please try again.`,
  },
  [EAdminAuthErrorCodes.ADMIN_USER_ALREADY_EXIST]: {
    title: `Admin user already exists`,
    message: () => (
      <div>
        Admin user already exists.&nbsp;
        <Link className="underline underline-offset-4 font-medium hover:font-bold transition-all" href={`/admin`}>
          Sign In
        </Link>
        &nbsp;now.
      </div>
    ),
  },
  [EAdminAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST]: {
    title: `Admin user does not exist`,
    message: () => (
      <div>
        Admin user does not exist.&nbsp;
        <Link className="underline underline-offset-4 font-medium hover:font-bold transition-all" href={`/admin`}>
          Sign In
        </Link>
        &nbsp;now.
      </div>
    ),
  },
  [EAdminAuthErrorCodes.ADMIN_USER_DEACTIVATED]: {
    title: `User account deactivated`,
    message: () => `User account deactivated. Please contact ${!!SUPPORT_EMAIL ? SUPPORT_EMAIL : "administrator"}.`,
  },
};

export const authErrorHandler = (
  errorCode: EAdminAuthErrorCodes,
  email?: string | undefined
): TAuthErrorInfo | undefined => {
  const bannerAlertErrorCodes = [
    EAdminAuthErrorCodes.ADMIN_ALREADY_EXIST,
    EAdminAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME,
    EAdminAuthErrorCodes.INVALID_ADMIN_EMAIL,
    EAdminAuthErrorCodes.INVALID_ADMIN_PASSWORD,
    EAdminAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD,
    EAdminAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED,
    EAdminAuthErrorCodes.ADMIN_USER_ALREADY_EXIST,
    EAdminAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST,
    EAdminAuthErrorCodes.ADMIN_USER_DEACTIVATED,
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

export const getBaseAuthenticationModes: (props: TGetBaseAuthenticationModeProps) => TInstanceAuthenticationModes[] = ({
  disabled,
  updateConfig,
  resolvedTheme,
}) => [
  {
    key: "unique-codes",
    name: "Unique codes",
    description:
      "Log in or sign up for Plane using codes sent via email. You need to have set up SMTP to use this method.",
    icon: <Mails className="h-6 w-6 p-0.5 text-custom-text-300/80" />,
    config: <EmailCodesConfiguration disabled={disabled} updateConfig={updateConfig} />,
  },
  {
    key: "passwords-login",
    name: "Passwords",
    description: "Allow members to create accounts with passwords and use it with their email addresses to sign in.",
    icon: <KeyRound className="h-6 w-6 p-0.5 text-custom-text-300/80" />,
    config: <PasswordLoginConfiguration disabled={disabled} updateConfig={updateConfig} />,
  },
  {
    key: "google",
    name: "Google",
    description: "Allow members to log in or sign up for Plane with their Google accounts.",
    icon: <Image src={GoogleLogo} height={20} width={20} alt="Google Logo" />,
    config: <GoogleConfiguration disabled={disabled} updateConfig={updateConfig} />,
  },
  {
    key: "github",
    name: "GitHub",
    description: "Allow members to log in or sign up for Plane with their GitHub accounts.",
    icon: (
      <Image
        src={resolveGeneralTheme(resolvedTheme) === "dark" ? githubDarkModeImage : githubLightModeImage}
        height={20}
        width={20}
        alt="GitHub Logo"
      />
    ),
    config: <GithubConfiguration disabled={disabled} updateConfig={updateConfig} />,
  },
  {
    key: "gitlab",
    name: "GitLab",
    description: "Allow members to log in or sign up to plane with their GitLab accounts.",
    icon: <Image src={GitlabLogo} height={20} width={20} alt="GitLab Logo" />,
    config: <GitlabConfiguration disabled={disabled} updateConfig={updateConfig} />,
  },
];
