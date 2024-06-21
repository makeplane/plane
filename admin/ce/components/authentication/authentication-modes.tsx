import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { KeyRound, Mails } from "lucide-react";
// types
import { TInstanceAuthenticationMethodKeys, TInstanceAuthenticationModes } from "@plane/types";
// components
import {
  AuthenticationMethodCard,
  EmailCodesConfiguration,
  GithubConfiguration,
  GitlabConfiguration,
  GoogleConfiguration,
  PasswordLoginConfiguration,
} from "@/components/authentication";
// helpers
import { resolveGeneralTheme } from "@/helpers/common.helper";
// images
import githubLightModeImage from "@/public/logos/github-black.png";
import githubDarkModeImage from "@/public/logos/github-white.png";
import GitlabLogo from "@/public/logos/gitlab-logo.svg";
import GoogleLogo from "@/public/logos/google-logo.svg";

export type TAuthenticationModeProps = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

export type TGetAuthenticationModeProps = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
  resolvedTheme: string | undefined;
};

// Authentication methods
export const getAuthenticationModes: (props: TGetAuthenticationModeProps) => TInstanceAuthenticationModes[] = ({
  disabled,
  updateConfig,
  resolvedTheme,
}) => [
    {
      key: "email-codes",
      name: "Email codes",
      description: "Login or sign up using codes sent via emails. You need to have email setup here and enabled.",
      icon: <Mails className="h-6 w-6 p-0.5 text-custom-text-300/80" />,
      config: <EmailCodesConfiguration disabled={disabled} updateConfig={updateConfig} />,
    },
    {
      key: "password-login",
      name: "Password based login",
      description: "Allow members to create accounts with passwords for emails to sign in.",
      icon: <KeyRound className="h-6 w-6 p-0.5 text-custom-text-300/80" />,
      config: <PasswordLoginConfiguration disabled={disabled} updateConfig={updateConfig} />,
    },
    {
      key: "google",
      name: "Google",
      description: "Allow members to login or sign up to plane with their Google accounts.",
      icon: <Image src={GoogleLogo} height={20} width={20} alt="Google Logo" />,
      config: <GoogleConfiguration disabled={disabled} updateConfig={updateConfig} />,
    },
    {
      key: "github",
      name: "Github",
      description: "Allow members to login or sign up to plane with their Github accounts.",
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
      description: "Allow members to login or sign up to plane with their GitLab accounts.",
      icon: <Image src={GitlabLogo} height={20} width={20} alt="GitLab Logo" />,
      config: <GitlabConfiguration disabled={disabled} updateConfig={updateConfig} />,
    },
  ];

export const AuthenticationModes: React.FC<TAuthenticationModeProps> = observer((props) => {
  const { disabled, updateConfig } = props;
  // next-themes
  const { resolvedTheme } = useTheme();

  return (
    <>
      {getAuthenticationModes({ disabled, updateConfig, resolvedTheme }).map((method) => (
        <AuthenticationMethodCard
          key={method.key}
          name={method.name}
          description={method.description}
          icon={method.icon}
          config={method.config}
          disabled={disabled}
        />
      ))}
    </>
  );
});
