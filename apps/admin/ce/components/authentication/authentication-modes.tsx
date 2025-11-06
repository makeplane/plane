import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { KeyRound, Mails } from "lucide-react";
// types
import type {
  TGetBaseAuthenticationModeProps,
  TInstanceAuthenticationMethodKeys,
  TInstanceAuthenticationModes,
} from "@plane/types";
import { resolveGeneralTheme } from "@plane/utils";
// components
import giteaLogo from "@/app/assets/logos/gitea-logo.svg?url";
import githubLightModeImage from "@/app/assets/logos/github-black.png?url";
import githubDarkModeImage from "@/app/assets/logos/github-white.png?url";
import GitlabLogo from "@/app/assets/logos/gitlab-logo.svg?url";
import GoogleLogo from "@/app/assets/logos/google-logo.svg?url";
import OIDCLogo from "@/app/assets/logos/oidc-logo.svg?url";
import SAMLLogo from "@/app/assets/logos/saml-logo.svg?url";
import { AuthenticationMethodCard } from "@/components/authentication/authentication-method-card";
import { EmailCodesConfiguration } from "@/components/authentication/email-config-switch";
import { GiteaConfiguration } from "@/components/authentication/gitea-config";
import { GithubConfiguration } from "@/components/authentication/github-config";
import { GitlabConfiguration } from "@/components/authentication/gitlab-config";
import { GoogleConfiguration } from "@/components/authentication/google-config";
import { PasswordLoginConfiguration } from "@/components/authentication/password-config-switch";
// plane admin components
import { UpgradeButton } from "@/plane-admin/components/common";
// assets

export type TAuthenticationModeProps = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

// Authentication methods
export const getAuthenticationModes: (props: TGetBaseAuthenticationModeProps) => TInstanceAuthenticationModes[] = ({
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
  {
    key: "gitea",
    name: "Gitea",
    description: "Allow members to log in or sign up to plane with their Gitea accounts.",
    icon: <Image src={giteaLogo} height={20} width={20} alt="Gitea Logo" />,
    config: <GiteaConfiguration disabled={disabled} updateConfig={updateConfig} />,
  },
  {
    key: "oidc",
    name: "OIDC",
    description: "Authenticate your users via the OpenID Connect protocol.",
    icon: <Image src={OIDCLogo} height={22} width={22} alt="OIDC Logo" />,
    config: <UpgradeButton />,
    unavailable: true,
  },
  {
    key: "saml",
    name: "SAML",
    description: "Authenticate your users via the Security Assertion Markup Language protocol.",
    icon: <Image src={SAMLLogo} height={22} width={22} alt="SAML Logo" className="pl-0.5" />,
    config: <UpgradeButton />,
    unavailable: true,
  },
];

export const AuthenticationModes = observer<React.FC<TAuthenticationModeProps>>((props) => {
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
          unavailable={method.unavailable}
        />
      ))}
    </>
  );
});
