# Python imports
import os
from datetime import datetime
from urllib.parse import urlencode

import pytz

# Module imports
from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


class MicrosoftOAuthProvider(OauthAdapter):
    provider = "microsoft"

    def __init__(self, request, code=None, state=None, callback=None):
        (MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID) = (
            get_configuration_value(
                [
                    {
                        "key": "MICROSOFT_CLIENT_ID",
                        "default": os.environ.get("MICROSOFT_CLIENT_ID"),
                    },
                    {
                        "key": "MICROSOFT_CLIENT_SECRET",
                        "default": os.environ.get("MICROSOFT_CLIENT_SECRET"),
                    },
                    {
                        "key": "MICROSOFT_TENANT_ID",
                        "default": os.environ.get("MICROSOFT_TENANT_ID", "common"),
                    },
                ]
            )
        )

        if not (MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["MICROSOFT_NOT_CONFIGURED"],
                error_message="MICROSOFT_NOT_CONFIGURED",
            )

        tenant_id = MICROSOFT_TENANT_ID or "common"
        client_id = MICROSOFT_CLIENT_ID
        client_secret = MICROSOFT_CLIENT_SECRET

        self.token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
        self.userinfo_url = "https://graph.microsoft.com/v1.0/me"
        self.scope = "openid profile email User.Read"

        redirect_uri = f"""{"https" if request.is_secure() else "http"}://{request.get_host()}/auth/microsoft/callback/"""
        url_params = {
            "client_id": client_id,
            "scope": self.scope,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "response_mode": "query",
            "state": state,
        }
        auth_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize?{urlencode(url_params)}"

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
        token_response = self.get_user_token(data=data)
        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.fromtimestamp(
                        token_response.get("expires_in"), tz=pytz.utc
                    )
                    if token_response.get("expires_in")
                    else None
                ),
                "refresh_token_expired_at": None,
                "id_token": token_response.get("id_token", ""),
            }
        )

    def set_user_data(self):
        user_info_response = self.get_user_response()
        email = user_info_response.get("mail") or user_info_response.get(
            "userPrincipalName"
        )
        user_data = {
            "email": email,
            "user": {
                "avatar": "",
                "first_name": user_info_response.get("givenName", ""),
                "last_name": user_info_response.get("surname", ""),
                "provider_id": user_info_response.get("id"),
                "is_password_autoset": True,
            },
        }
        super().set_user_data(user_data)
