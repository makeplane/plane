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

import base64

AUTHENTICATION_ERROR_CODES = {
    # Global
    "INSTANCE_NOT_CONFIGURED": 5000,
    "INVALID_EMAIL": 5005,
    "EMAIL_REQUIRED": 5010,
    "SIGNUP_DISABLED": 5015,
    "MAGIC_LINK_LOGIN_DISABLED": 5016,
    "PASSWORD_LOGIN_DISABLED": 5018,
    "USER_ACCOUNT_DEACTIVATED": 5019,
    # Password strength
    "INVALID_PASSWORD": 5020,
    "PASSWORD_TOO_WEAK": 5021,
    "SMTP_NOT_CONFIGURED": 5025,
    "REQUIRED_USERNAME_PASSWORD_SIGN_IN": 5026,
    # Sign Up
    "USER_ALREADY_EXIST": 5030,
    "SECURITY_VERIFICATION_FAILED_SIGN_UP": 5031,
    "AUTHENTICATION_FAILED_SIGN_UP": 5035,
    "REQUIRED_EMAIL_PASSWORD_SIGN_UP": 5040,
    "INVALID_EMAIL_SIGN_UP": 5045,
    "INVALID_EMAIL_MAGIC_SIGN_UP": 5050,
    "MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED": 5055,
    "EMAIL_PASSWORD_AUTHENTICATION_DISABLED": 5056,
    # Sign In
    "USER_DOES_NOT_EXIST": 5060,
    "SECURITY_VERIFICATION_FAILED_SIGN_IN": 5061,
    "AUTHENTICATION_FAILED_SIGN_IN": 5065,
    "REQUIRED_EMAIL_PASSWORD_SIGN_IN": 5070,
    "INVALID_EMAIL_SIGN_IN": 5075,
    "INVALID_EMAIL_MAGIC_SIGN_IN": 5080,
    "MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED": 5085,
    # Both Sign in and Sign up for magic
    "INVALID_MAGIC_CODE_SIGN_IN": 5090,
    "INVALID_MAGIC_CODE_SIGN_UP": 5092,
    "EXPIRED_MAGIC_CODE_SIGN_IN": 5095,
    "EXPIRED_MAGIC_CODE_SIGN_UP": 5097,
    "SECURITY_VERIFICATION_FAILED_MAGIC_CODE_SIGN_IN": 5098,
    "SECURITY_VERIFICATION_FAILED_MAGIC_CODE_SIGN_UP": 5099,
    "EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN": 5100,
    "EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP": 5102,
    # Oauth
    "OAUTH_NOT_CONFIGURED": 5104,
    "GOOGLE_NOT_CONFIGURED": 5105,
    "GITHUB_NOT_CONFIGURED": 5110,
    "GITHUB_USER_NOT_IN_ORG": 5122,
    "GITLAB_NOT_CONFIGURED": 5111,
    "GITEA_NOT_CONFIGURED": 5112,
    "GOOGLE_OAUTH_PROVIDER_ERROR": 5115,
    "GITHUB_OAUTH_PROVIDER_ERROR": 5120,
    "GITLAB_OAUTH_PROVIDER_ERROR": 5121,
    "GITEA_OAUTH_PROVIDER_ERROR": 5123,
    # OIDC
    "OIDC_NOT_CONFIGURED": 6015,
    "OIDC_PROVIDER_ERROR": 6020,
    # SAML
    "SAML_NOT_CONFIGURED": 6025,
    "SAML_PROVIDER_ERROR": 6030,
    # Reset Password
    "INVALID_PASSWORD_TOKEN": 5125,
    "EXPIRED_PASSWORD_TOKEN": 5130,
    # Change password
    "INCORRECT_OLD_PASSWORD": 5135,
    "MISSING_PASSWORD": 5138,
    "INVALID_NEW_PASSWORD": 5140,
    "PASSWORD_SAME_AS_CURRENT": 5142,
    # set password
    "PASSWORD_ALREADY_SET": 5145,
    # Admin
    "ADMIN_ALREADY_EXIST": 5150,
    "REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME": 5155,
    "INVALID_ADMIN_EMAIL": 5160,
    "INVALID_ADMIN_PASSWORD": 5165,
    "REQUIRED_ADMIN_EMAIL_PASSWORD": 5170,
    "ADMIN_AUTHENTICATION_FAILED": 5175,
    "ADMIN_USER_ALREADY_EXIST": 5180,
    "ADMIN_USER_DOES_NOT_EXIST": 5185,
    "ADMIN_USER_DEACTIVATED": 5190,
    # Rate limit
    "RATE_LIMIT_EXCEEDED": 5900,
    # Unknown
    "AUTHENTICATION_FAILED": 5999,
    # user not onboarded
    "USER_NOT_ONBOARDED": 6000,
    "TOKEN_NOT_SET": 6005,
    "MOBILE_SIGNUP_DISABLED": 6010,
    # LDAP
    "LDAP_NOT_CONFIGURED": 5200,
    "LDAP_BIND_FAILED": 5205,
    "LDAP_SERVER_DOWN": 5210,
    "LDAP_CONNECTION_ERROR": 5215,
    "LDAP_SEARCH_ERROR": 5220,
    "LDAP_USER_NOT_FOUND": 5230,
    "LDAP_AUTHENTICATION_FAILED": 5235,
    "LDAP_NO_EMAIL_FOUND": 5240,
    # Security
    "SECURITY_VERIFICATION_FAILED": 6015,
    # Email Rate Limit
    "EMAIL_RATE_LIMIT_EXCEEDED": 6020,
    # SSO
    "DOMAIN_REQUIRED": 5200,
    "DOMAIN_NOT_CONFIGURED": 5201,
    "DOMAIN_NOT_FOUND": 5205,
    "DOMAIN_NOT_VERIFIED": 5210,
    "DOMAIN_VERIFICATION_FAILED": 5215,
    "DOMAIN_ALREADY_VERIFIED_FOR_ANOTHER_WORKSPACE": 5220,
    "DOMAIN_ALREADY_ASSOCIATED_WITH_WORKSPACE": 5225,
    "WORKSPACE_NOT_FOUND": 5230,
    "INVALID_PROVIDER": 5235,
    "OIDC_CONFIGURATION_INCOMPLETE": 5240,
    "OIDC_ALREADY_CONFIGURED": 5245,
    "SAML_CONFIGURATION_INCOMPLETE": 5250,
    "SAML_ALREADY_CONFIGURED": 5255,
    "SSO_NOT_CONFIGURED": 5260,
}


class AuthenticationException(Exception):
    error_code = None
    error_message = None
    payload = {}

    def __init__(self, error_code, error_message, payload={}):
        self.error_code = error_code
        self.error_message = error_message
        self.payload = payload

    def get_error_dict(self):
        error = {"error_code": self.error_code, "error_message": self.error_message}
        for key in self.payload:
            # Encode email as base64 and use 'ctx' as param name to avoid exposing PII in URLs
            if key == "email" and self.payload[key]:
                encoded_email = base64.b64encode(str(self.payload[key]).encode()).decode()
                error["ctx"] = encoded_email
            else:
                error[key] = self.payload[key]

        return error
