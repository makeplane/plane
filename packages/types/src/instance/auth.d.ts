export type TInstanceAuthenticationMethodKeys =
  | "ENABLE_SIGNUP"
  | "ENABLE_MAGIC_LINK_LOGIN"
  | "ENABLE_EMAIL_PASSWORD"
  | "IS_GOOGLE_ENABLED"
  | "IS_GITHUB_ENABLED";

export type TInstanceGoogleAuthenticationConfigurationKeys =
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET";

export type TInstanceGithubAuthenticationConfigurationKeys =
  | "GITHUB_CLIENT_ID"
  | "GITHUB_CLIENT_SECRET";

type TInstanceAuthenticationConfigurationKeys =
  | TInstanceGoogleAuthenticationConfigurationKeys
  | TInstanceGithubAuthenticationConfigurationKeys;

export type TInstanceAuthenticationKeys =
  | TInstanceAuthenticationMethodKeys
  | TInstanceAuthenticationConfigurationKeys;
