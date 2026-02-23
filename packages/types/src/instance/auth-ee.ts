/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

export type TExtendedInstanceAuthenticationModeKeys = "oidc" | "saml" | "ldap";

export type TInstanceEnterpriseAuthenticationMethodKeys = "IS_OIDC_ENABLED" | "IS_SAML_ENABLED" | "IS_LDAP_ENABLED";

export type TInstanceOIDCAuthenticationConfigurationKeys =
  | "OIDC_CLIENT_ID"
  | "OIDC_CLIENT_SECRET"
  | "OIDC_TOKEN_URL"
  | "OIDC_USERINFO_URL"
  | "OIDC_AUTHORIZE_URL"
  | "OIDC_LOGOUT_URL"
  | "OIDC_PROVIDER_NAME"
  | "ENABLE_OIDC_IDP_SYNC";

export type TInstanceSAMLAuthenticationConfigurationKeys =
  | "SAML_ENTITY_ID"
  | "SAML_SSO_URL"
  | "SAML_LOGOUT_URL"
  | "SAML_CERTIFICATE"
  | "SAML_PROVIDER_NAME"
  | "ENABLE_SAML_IDP_SYNC"
  | "SAML_DISABLE_REQUESTED_AUTHN_CONTEXT"
  | "SAML_NAME_ID_FORMAT"
  | "SAML_ATTRIBUTE_MAPPING";

export type TInstanceLDAPAuthenticationConfigurationKeys =
  | "LDAP_SERVER_URI"
  | "LDAP_BIND_DN"
  | "LDAP_BIND_PASSWORD"
  | "LDAP_USER_SEARCH_BASE"
  | "LDAP_USER_SEARCH_FILTER"
  | "LDAP_USER_ATTRIBUTES"
  | "LDAP_PROVIDER_NAME";

export type TInstanceEnterpriseAuthenticationConfigurationKeys =
  | TInstanceOIDCAuthenticationConfigurationKeys
  | TInstanceSAMLAuthenticationConfigurationKeys
  | TInstanceLDAPAuthenticationConfigurationKeys;

export type TInstanceEnterpriseAuthenticationKeys =
  | TInstanceEnterpriseAuthenticationMethodKeys
  | TInstanceEnterpriseAuthenticationConfigurationKeys;

export type TExtendedLoginMediums = "oidc" | "saml";
