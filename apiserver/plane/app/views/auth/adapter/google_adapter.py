# Python imports
from datetime import datetime

import pytz

# Module imports
from .adapter import Adapter


class GoogleAuthAdapter(Adapter):

    token_url = "https://oauth2.googleapis.com/token"
    userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    scope = "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
    provider = "google"

    def __init__(
        self,
        client_id,
        request,
        client_secret=None,
        code=None,
    ):
        redirect_uri = (
            f"{request.scheme}://{request.get_host()}/auth/callback/google/"
        )
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope={self.scope}&access_type=offline&prompt=consent"
        super().__init__(
            request=request,
            provider=self.provider,
            client_id=client_id,
            scope=self.scope,
            redirect_uri=redirect_uri,
            client_secret=client_secret,
            auth_url=auth_url,
            token_url=self.token_url,
            userinfo_url=self.userinfo_url,
            code=code,
        )

    def validate_user(self):
        self.get_user_token()
        self.get_user_response()
        return self.user_data.get("email")

    def get_user_token(self):
        print(self.code)
        data = {
            "code": self.code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        token_response = super().get_user_token(data=data)
        data = {
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
        self.set_token_data(data=data)
        return token_response

    def get_user_response(self):
        user_info_response = super().get_user_response()
        data = {
            "email": user_info_response.get("email"),
            "user": {
                "provider_id": user_info_response.get("id"),
                "email": user_info_response.get("email"),
                "avatar": user_info_response.get("picture"),
                "first_name": user_info_response.get("given_name"),
                "last_name": user_info_response.get("family_name"),
            },
        }
        self.set_user_data(data=data)
        return data

    def complete_login(self):
        return super().complete_login()
    
    def complete_signup(self):
        return super().complete_signup()
