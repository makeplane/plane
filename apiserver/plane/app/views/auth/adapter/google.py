# Python imports
from datetime import datetime

import pytz
import requests

# Module imports
from .provider import Provider


class GoogleAuthProvider(Provider):

    def __init__(
        self,
        client_id,
        request,
        client_secret=None,
    ):
        scope = "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
        redirect_uri = (
            f"{request.scheme}://{request.get_host()}/auth/callback/google/"
        )
        provider = "google"
        super().__init__(
            request=request,
            provider=provider,
            client_id=client_id,
            scope=scope,
            redirect_uri=redirect_uri,
            client_secret=client_secret,
        )

    def get_auth_url(self):
        return f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={self.client_id}&redirect_uri={self.redirect_uri}&scope={self.scope}&access_type=offline&prompt=consent"

    def get_token_url(self):
        return "https://oauth2.googleapis.com/token"

    def get_user_info_url(self):
        return "https://www.googleapis.com/oauth2/v2/userinfo"

    def complete_login(self, user, provider_response):
        return super().complete_login(user, provider_response)

    def get_user_token(self, code):
        url = self.get_token_url()
        data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        token_response = requests.post(url, data=data).json()
        return {
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

    def get_user_response(self, code):
        token_data = self.get_user_token(code=code)
        headers = {"Authorization": f"Bearer {token_data.get('access_token')}"}
        user_info_response = requests.get(
            self.get_user_info_url(), headers=headers
        ).json()
        return {
            "email": user_info_response.get("email"),
            "user": {
                "provider_id": user_info_response.get("id"),
                "email": user_info_response.get("email"),
                "avatar": user_info_response.get("picture"),
                "first_name": user_info_response.get("given_name"),
                "last_name": user_info_response.get("family_name"),
            },
            "token": token_data,
        }
