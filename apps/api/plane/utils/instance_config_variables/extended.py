# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# OIDC
oidc_config_variables = [
    {
        "key": "OIDC_CLIENT_ID",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "OIDC_CLIENT_SECRET",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": True,
    },
    {
        "key": "OIDC_TOKEN_URL",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "OIDC_USERINFO_URL",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "OIDC_AUTHORIZE_URL",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "IS_OIDC_ENABLED",
        "value": "0",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "OIDC_LOGOUT_URL",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "OIDC_PROVIDER_NAME",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "ENABLE_OIDC_IDP_SYNC",
        "value": "0",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
]

# SAML
saml_config_variables = [
    {
        "key": "SAML_ENTITY_ID",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "SAML_SSO_URL",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "SAML_CERTIFICATE",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": True,
    },
    {
        "key": "SAML_LOGOUT_URL",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "IS_SAML_ENABLED",
        "value": "0",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "SAML_PROVIDER_NAME",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "ENABLE_SAML_IDP_SYNC",
        "value": "0",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "SAML_DISABLE_REQUESTED_AUTHN_CONTEXT",
        "value": "0",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "SAML_NAME_ID_FORMAT",
        "value": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "SAML_ATTRIBUTE_MAPPING",
        "value": {"email": "email", "first_name": "first_name", "last_name": "last_name", "display_name": "preferred_username"}, #noqa: E501
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
]

# ldap config
ldap_config_variables = [
    {
        "key": "IS_LDAP_ENABLED",
        "value": "0",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "LDAP_SERVER_URI",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "LDAP_BIND_DN",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "LDAP_BIND_PASSWORD",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": True,
    },
    {
        "key": "LDAP_USER_SEARCH_BASE",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "LDAP_USER_SEARCH_FILTER",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "LDAP_USER_ATTRIBUTES",
        "value": "mail,cn,givenName,sn",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
    {
        "key": "LDAP_PROVIDER_NAME",
        "value": "",
        "category": "AUTHENTICATION",
        "is_encrypted": False,
    },
]

extended_config_variables = [*oidc_config_variables, *saml_config_variables, *ldap_config_variables]
