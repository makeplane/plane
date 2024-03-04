# Module imports
from datetime import datetime

import pytz

from .adapter import OauthAdapter


class GoogleAuthAdapter(OauthAdapter):
    token_url = "https://oauth2.googleapis.com/token"
    userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    scope = "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
    provider = "google"

    def __init__(self, request, client_id, client_secret=None, code=None):
        redirect_uri = (
            f"{request.scheme}://{request.get_host()}/auth/callback/google/"
        )
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope={self.scope}&access_type=offline&prompt=consent"
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
                "provider_id": user_info_response.get("id"),
            },
        }
        super().set_user_data(user_data)
