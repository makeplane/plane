export type TInstanceEnterpriseAuthenticationMethodKeys =
  | "IS_OIDC_ENABLED"
  | "IS_SAML_ENABLED";

export type TInstanceOIDCAuthenticationConfigurationKeys =
  | "OIDC_CLIENT_ID"
  | "OIDC_CLIENT_SECRET"
  | "OIDC_TOKEN_URL"
  | "OIDC_USERINFO_URL"
  | "OIDC_AUTHORIZE_URL"
  | "OIDC_LOGOUT_URL"
  | "OIDC_PROVIDER_NAME";

export type TInstanceSAMLAuthenticationConfigurationKeys =
  | "SAML_ENTITY_ID"
  | "SAML_SSO_URL"
  | "SAML_LOGOUT_URL"
  | "SAML_CERTIFICATE"
  | "SAML_PROVIDER_NAME";

export type TInstanceEnterpriseAuthenticationConfigurationKeys =
  | TInstanceOIDCAuthenticationConfigurationKeys
  | TInstanceSAMLAuthenticationConfigurationKeys;

export type TInstanceEnterpriseAuthenticationKeys =
  | TInstanceEnterpriseAuthenticationMethodKeys
  | TInstanceEnterpriseAuthenticationConfigurationKeys;
