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


class OIDCOAuthProvider(OauthAdapter):

    provider = "oidc"
    scope = "openid email profile"

    def __init__(self, request, code=None, state=None):
        (
            OIDC_CLIENT_ID,
            OIDC_CLIENT_SECRET,
            OIDC_TOKEN_URL,
            OIDC_USERINFO_URL,
            OIDC_AUTHORIZE_URL,
        ) = get_configuration_value(
            [
                {
                    "key": "OIDC_CLIENT_ID",
                    "default": os.environ.get("OIDC_CLIENT_ID"),
                },
                {
                    "key": "OIDC_CLIENT_SECRET",
                    "default": os.environ.get("OIDC_CLIENT_SECRET"),
                },
                {
                    "key": "OIDC_TOKEN_URL",
                    "default": os.environ.get("OIDC_TOKEN_URL"),
                },
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

        if not (
            OIDC_CLIENT_ID
            and OIDC_CLIENT_SECRET
            and OIDC_TOKEN_URL
            and OIDC_USERINFO_URL
            and OIDC_AUTHORIZE_URL
        ):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        redirect_uri = (
            f"{request.scheme}://{request.get_host()}/auth/oidc/callback/"
        )
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
        token_response = self.get_user_token(
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.fromtimestamp(
                        token_response.get("expires_in"),
                        tz=pytz.utc,
                    )
                    if token_response.get("expires_in")
                    else None
                ),
                "refresh_token_expired_at": (
                    datetime.fromtimestamp(
                        token_response.get("refresh_token_expired_at"),
                        tz=pytz.utc,
                    )
                    if token_response.get("refresh_token_expired_at")
                    else None
                ),
            }
        )

    def set_user_data(self):
        user_info_response = self.get_user_response()
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
        super().set_user_data(user_data)

    def logout(self):
        (OIDC_LOGOUT_URL,) = get_configuration_value(
            [
                {
                    "key": "OIDC_LOGOUT_URL",
                    "default": os.environ.get("OIDC_LOGOUT_URL"),
                },
            ]
        )
        if OIDC_LOGOUT_URL:
            return OIDC_LOGOUT_URL
        else:
            return False
