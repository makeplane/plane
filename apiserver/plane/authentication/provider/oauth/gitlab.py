# Python imports
import os
from datetime import datetime
from urllib.parse import urlencode

import pytz

# Module imports
from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)


class GitLabOAuthProvider(OauthAdapter):
    provider = "gitlab"
    scope = "read_user"

    def __init__(self, request, code=None, state=None, callback=None):
        GITLAB_CLIENT_ID, GITLAB_CLIENT_SECRET, GITLAB_HOST = get_configuration_value(
            [
                {
                    "key": "GITLAB_CLIENT_ID",
                    "default": os.environ.get("GITLAB_CLIENT_ID"),
                },
                {
                    "key": "GITLAB_CLIENT_SECRET",
                    "default": os.environ.get("GITLAB_CLIENT_SECRET"),
                },
                {
                    "key": "GITLAB_HOST",
                    "default": os.environ.get("GITLAB_HOST", "https://gitlab.com"),
                },
            ]
        )

        self.host = GITLAB_HOST
        self.token_url = f"{self.host}/oauth/token"
        self.userinfo_url = f"{self.host}/api/v4/user"

        if not (GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET and GITLAB_HOST):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GITLAB_NOT_CONFIGURED"],
                error_message="GITLAB_NOT_CONFIGURED",
            )

        client_id = GITLAB_CLIENT_ID
        client_secret = GITLAB_CLIENT_SECRET

        redirect_uri = f"""{"https" if request.is_secure() else "http"}://{request.get_host()}/auth/gitlab/callback/"""
        url_params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": self.scope,
            "state": state,
        }
        auth_url = f"{self.host}/oauth/authorize?{urlencode(url_params)}"
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
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": self.code,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        token_response = self.get_user_token(
            data=data, headers={"Accept": "application/json"}
        )
        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.fromtimestamp(
                        token_response.get("created_at")
                        + token_response.get("expires_in"),
                        tz=pytz.utc,
                    )
                    if token_response.get("expires_in")
                    else None
                ),
                "refresh_token_expired_at": (
                    datetime.fromtimestamp(
                        token_response.get("refresh_token_expired_at"), tz=pytz.utc
                    )
                    if token_response.get("refresh_token_expired_at")
                    else None
                ),
                "id_token": token_response.get("id_token", ""),
            }
        )

    def set_user_data(self):
        user_info_response = self.get_user_response()
        email = user_info_response.get("email")
        super().set_user_data(
            {
                "email": email,
                "user": {
                    "provider_id": user_info_response.get("id"),
                    "email": email,
                    "avatar": user_info_response.get("avatar_url"),
                    "first_name": user_info_response.get("name"),
                    "last_name": user_info_response.get("family_name"),
                    "is_password_autoset": True,
                },
            }
        )
