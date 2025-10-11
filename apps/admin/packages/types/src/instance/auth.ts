export type TInstanceAuthenticationModes = {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  config: React.ReactNode;
  unavailable?: boolean;
};

export type TInstanceAuthenticationMethodKeys =
  | "ENABLE_SIGNUP"
  | "ENABLE_MAGIC_LINK_LOGIN"
  | "ENABLE_EMAIL_PASSWORD"
  | "IS_GOOGLE_ENABLED"
  | "IS_GITHUB_ENABLED"
  | "IS_GITLAB_ENABLED";

export type TInstanceGoogleAuthenticationConfigurationKeys = "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET";

export type TInstanceGithubAuthenticationConfigurationKeys =
  | "GITHUB_CLIENT_ID"
  | "GITHUB_CLIENT_SECRET"
  | "GITHUB_ORGANIZATION_ID";

export type TInstanceGitlabAuthenticationConfigurationKeys =
  | "GITLAB_HOST"
  | "GITLAB_CLIENT_ID"
  | "GITLAB_CLIENT_SECRET";

export type TInstanceAuthenticationConfigurationKeys =
  | TInstanceGoogleAuthenticationConfigurationKeys
  | TInstanceGithubAuthenticationConfigurationKeys
  | TInstanceGitlabAuthenticationConfigurationKeys;

export type TInstanceAuthenticationKeys = TInstanceAuthenticationMethodKeys | TInstanceAuthenticationConfigurationKeys;

export type TGetBaseAuthenticationModeProps = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
  resolvedTheme: string | undefined;
};
