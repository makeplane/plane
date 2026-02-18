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

# Python imports
import os
from datetime import datetime
from typing import Optional
from urllib.parse import urlencode
import pytz
import logging

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.adapter.oauth import OauthAdapter
from plane.db.models import Account, User
from plane.authentication.models import IdentityProvider, Domain
from plane.license.utils.instance_value import get_configuration_value


logger = logging.getLogger("plane.authentication")


class OIDCOAuthProvider(OauthAdapter):
    provider = "oidc"
    scope = "openid email profile"
    # Store the raw userinfo response for group sync
    userinfo_response = None

    def __init__(self, request, code=None, state=None, redirect_uri: Optional[str] = None):
        (
            OIDC_CLIENT_ID,
            OIDC_CLIENT_SECRET,
            OIDC_TOKEN_URL,
            OIDC_USERINFO_URL,
            OIDC_AUTHORIZE_URL,
        ) = get_configuration_value(
            [
                {"key": "OIDC_CLIENT_ID", "default": os.environ.get("OIDC_CLIENT_ID")},
                {
                    "key": "OIDC_CLIENT_SECRET",
                    "default": os.environ.get("OIDC_CLIENT_SECRET"),
                },
                {"key": "OIDC_TOKEN_URL", "default": os.environ.get("OIDC_TOKEN_URL")},
                {
                    "key": "OIDC_USERINFO_URL",
                    "default": os.environ.get("OIDC_USERINFO_URL"),
                },
                {
                    "key": "OIDC_AUTHORIZE_URL",
                    "default": os.environ.get("OIDC_AUTHORIZE_URL"),
                },
            ]
        )

        if not (OIDC_CLIENT_ID and OIDC_CLIENT_SECRET and OIDC_TOKEN_URL and OIDC_USERINFO_URL and OIDC_AUTHORIZE_URL):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        if redirect_uri is None:
            redirect_uri = f"{request.scheme}://{request.get_host()}/auth/oidc/callback/"

        url_params = {
            "client_id": OIDC_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "state": state,
            "scope": self.scope,
        }
        auth_url = f"{OIDC_AUTHORIZE_URL}?{urlencode(url_params)}"
        super().__init__(
            request,
            self.provider,
            OIDC_CLIENT_ID,
            self.scope,
            redirect_uri,
            auth_url,
            OIDC_TOKEN_URL,
            OIDC_USERINFO_URL,
            OIDC_CLIENT_SECRET,
            code,
        )

    def set_token_data(self):
        data = {
            "code": self.code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        token_response = self.get_user_token(data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.fromtimestamp(token_response.get("expires_in"), tz=pytz.utc)
                    if token_response.get("expires_in")
                    else None
                ),
                "refresh_token_expired_at": (
                    datetime.fromtimestamp(token_response.get("refresh_token_expired_at"), tz=pytz.utc)
                    if token_response.get("refresh_token_expired_at")
                    else None
                ),
                "id_token": token_response.get("id_token", ""),
            }
        )

    def set_user_data(self):
        user_info_response = self.get_user_response()
        # Store the raw userinfo response for group sync
        self.userinfo_response = user_info_response

        # Get display name and email from user info response
        display_name = user_info_response.get("preferred_username")
        email = user_info_response.get("email")

        if not email:
            logger.warning("Email not found in user info response")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL"],
                error_message="INVALID_EMAIL",
            )

        # If display name is not provided, extract from email or generate random string
        if not display_name:
            display_name = User.get_display_name(email)

        # Set user data
        user_data = {
            "email": email,
            "user": {
                "avatar": user_info_response.get("picture"),
                "first_name": user_info_response.get("given_name", ""),
                "last_name": user_info_response.get("family_name", ""),
                "provider_id": user_info_response.get("sub", ""),
                "display_name": display_name,
                "is_password_autoset": True,
            },
        }
        super().set_user_data(user_data)

    def logout(self, logout_url=None):
        (OIDC_LOGOUT_URL,) = get_configuration_value(
            [{"key": "OIDC_LOGOUT_URL", "default": os.environ.get("OIDC_LOGOUT_URL")}]
        )

        account = Account.objects.filter(user=self.request.user, provider=self.provider).first()

        id_token = account.id_token if account and account.id_token else None
        if OIDC_LOGOUT_URL and id_token and logout_url:
            return f"{OIDC_LOGOUT_URL}?id_token_hint={id_token}&post_logout_redirect_uri={logout_url}"
        else:
            return False


class OIDCOAuthCloudProvider(OIDCOAuthProvider):
    """
    This class is used to authenticate a user using OIDC in the cloud environment.

    Args:
        request: The request object.
        workspace_id: The workspace id.
        code: The code received from the OIDC provider.
        state: The state received from the OIDC provider.

    """

    workspace_id = None

    def __init__(self, request, workspace_id, code=None, state=None):
        # Get the oidc provider for the workspace
        oidc_provider = IdentityProvider.objects.filter(
            workspace_id=workspace_id, provider=IdentityProvider.OIDC, is_enabled=True
        ).first()
        if not oidc_provider:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        # Get the oidc provider configuration
        redirect_uri = f"{request.scheme}://{request.get_host()}/auth/sso/oidc/callback/{workspace_id}/"
        url_params = {
            "client_id": oidc_provider.client_id,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "state": state,
            "scope": self.scope,
        }
        auth_url = f"{oidc_provider.authorize_url}?{urlencode(url_params)}"

        # Set the workspace id
        self.workspace_id = workspace_id

        # Initialize the oauth adapter
        OauthAdapter.__init__(
            self,
            request=request,
            provider=self.provider,
            client_id=oidc_provider.client_id,
            scope=self.scope,
            redirect_uri=redirect_uri,
            auth_url=auth_url,
            token_url=oidc_provider.token_url,
            userinfo_url=oidc_provider.userinfo_url,
            client_secret=oidc_provider.client_secret,
            code=code,
        )

    def set_user_data(self):
        user_info_response = self.get_user_response()
        # Store the raw userinfo response for group sync
        self.userinfo_response = user_info_response

        email = user_info_response.get("email")

        # Get the email from the user info response and check if the
        # email domain is configured with verified domain
        email_parts = email.split("@")
        if len(email_parts) != 2:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL"],
                error_message="INVALID_EMAIL",
                payload={"email": email},
            )

        email_domain = email_parts[1]
        # Check if the domain is configured with sso
        domain = Domain.objects.filter(domain=email_domain, verification_status=Domain.VERIFIED).first()
        if not domain:
            logger.warning("Domain not configured", extra={"email": str(email)})
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["DOMAIN_NOT_CONFIGURED"],
                error_message="DOMAIN_NOT_CONFIGURED",
                payload={"email": str(email)},
            )

        # Check if the oidc provider is configured for the workspace
        if not IdentityProvider.is_oidc_configured(domain.workspace_id):
            logger.warning("OIDC not configured for the workspace", extra={"workspace_id": domain.workspace_id})
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        user_data = {
            "email": user_info_response.get("email"),
            "user": {
                "avatar": user_info_response.get("picture"),
                "first_name": user_info_response.get("given_name"),
                "last_name": user_info_response.get("family_name"),
                "provider_id": user_info_response.get("sub"),
                "is_password_autoset": True,
            },
        }
        OauthAdapter.set_user_data(self, user_data)

    def authenticate(self):
        # Check if the workspace has a sso provider configured
        sso_provider = IdentityProvider.objects.filter(
            workspace_id=self.workspace_id, provider=IdentityProvider.OIDC, is_enabled=True
        ).exists()
        if not sso_provider:
            logger.warning(
                "OIDC not configured for the workspace",
                extra={
                    "error_code": AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                    "error_message": "OIDC_NOT_CONFIGURED",
                    "workspace_id": self.workspace_id,
                },
            )
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
                payload={"workspace_id": str(self.workspace_id)},
            )
        return super().authenticate()

    def logout(self, logout_url=None):
        # Get the oidc provider for the workspace
        oidc_provider = IdentityProvider.objects.filter(
            workspace_id=self.workspace_id, provider=IdentityProvider.OIDC, is_enabled=True, logout_url__isnull=False
        ).first()
        if not oidc_provider:
            return False

        # Get the account for the user
        account = Account.objects.filter(user=self.request.user, provider=self.provider).first()
        if not account:
            return False

        # Get the id token for the account
        id_token = account.id_token if account and account.id_token else None
        if not id_token:
            return False

        # Return the logout url
        return f"{oidc_provider.logout_url}?id_token_hint={id_token}&post_logout_redirect_uri={logout_url}"
