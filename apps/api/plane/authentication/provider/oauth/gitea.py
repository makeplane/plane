import os
from datetime import datetime, timedelta
from urllib.parse import urlencode, urlparse
import pytz
import requests

# Module imports
from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


class GiteaOAuthProvider(OauthAdapter):
    provider = "gitea"
    scope = "openid email profile"

    def __init__(self, request, code=None, state=None, callback=None):
        (GITEA_CLIENT_ID, GITEA_CLIENT_SECRET, GITEA_HOST) = get_configuration_value(
            [
                {
                    "key": "GITEA_CLIENT_ID",
                    "default": os.environ.get("GITEA_CLIENT_ID"),
                },
                {
                    "key": "GITEA_CLIENT_SECRET",
                    "default": os.environ.get("GITEA_CLIENT_SECRET"),
                },
                {
                    "key": "GITEA_HOST",
                    "default": os.environ.get("GITEA_HOST"),
                },
            ]
        )

        if not (GITEA_CLIENT_ID and GITEA_CLIENT_SECRET and GITEA_HOST):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GITEA_NOT_CONFIGURED"],
                error_message="GITEA_NOT_CONFIGURED",
            )

        # Enforce scheme and normalize trailing slash(es)
        parsed = urlparse(GITEA_HOST)
        if not parsed.scheme or parsed.scheme not in ("https", "http"):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GITEA_NOT_CONFIGURED"],
                error_message="GITEA_NOT_CONFIGURED",  # avoid leaking details to query params
            )
        GITEA_HOST = GITEA_HOST.rstrip("/")

        # Set URLs based on the host
        self.token_url = f"{GITEA_HOST}/login/oauth/access_token"
        self.userinfo_url = f"{GITEA_HOST}/api/v1/user"

        client_id = GITEA_CLIENT_ID
        client_secret = GITEA_CLIENT_SECRET

        redirect_uri = f"{'https' if request.is_secure() else 'http'}://{request.get_host()}/auth/gitea/callback/"
        url_params = {
            "client_id": client_id,
            "scope": self.scope,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
        }
        auth_url = f"{GITEA_HOST}/login/oauth/authorize?{urlencode(url_params)}"

        super().__init__(
            request,
            self.provider,
            client_id,
            self.scope,
            redirect_uri,
            auth_url,
            self.token_url,
            self.userinfo_url,
            client_secret,
            code,
            callback=callback,
        )

    def set_token_data(self):
        data = {
            "code": self.code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        headers = {"Accept": "application/json"}
        token_response = self.get_user_token(data=data, headers=headers)
        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.now(tz=pytz.utc) + timedelta(seconds=token_response.get("expires_in"))
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

    def __get_email(self, headers):
        try:
            # Gitea may not provide email in user response, so fetch it separately
            emails_url = f"{self.userinfo_url}/emails"
            response = requests.get(emails_url, headers=headers)
            if not response.ok:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["GITEA_OAUTH_PROVIDER_ERROR"],
                    error_message="GITEA_OAUTH_PROVIDER_ERROR: Failed to fetch emails",
                )
            emails_response = response.json()

            if not emails_response:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["GITEA_OAUTH_PROVIDER_ERROR"],
                    error_message="GITEA_OAUTH_PROVIDER_ERROR: No emails found",
                )
            # Prefer primary+verified, then any verified, then primary, else first
            email = next((e.get("email") for e in emails_response if e.get("primary") and e.get("verified")), None)
            if not email:
                email = next((e.get("email") for e in emails_response if e.get("verified")), None)
            if not email:
                email = next((e.get("email") for e in emails_response if e.get("primary")), None)
            if not email and emails_response:
                # If no primary email, use the first one
                email = emails_response[0].get("email")
            return email
        except requests.RequestException:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GITEA_OAUTH_PROVIDER_ERROR"],
                error_message="GITEA_OAUTH_PROVIDER_ERROR: Exception occurred while fetching emails",
            )

    def set_user_data(self):
        user_info_response = self.get_user_response()
        headers = {
            "Authorization": f"Bearer {self.token_data.get('access_token')}",
            "Accept": "application/json",
        }

        # Get email if not provided in user info
        email = user_info_response.get("email")
        if not email:
            email = self.__get_email(headers=headers)

        super().set_user_data(
            {
                "email": email,
                "user": {
                    "provider_id": str(user_info_response.get("id")),
                    "email": email,
                    "avatar": user_info_response.get("avatar_url"),
                    "first_name": user_info_response.get("full_name") or user_info_response.get("login"),
                    "last_name": "",  # Gitea doesn't provide separate first/last name
                    "is_password_autoset": True,
                },
            }
        )
