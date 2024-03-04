# Python imports
from datetime import datetime

import pytz
import requests

# Module imports
from .adapter import Adapter


class GithubAuthAdapter(Adapter):

    token_url = "https://github.com/login/oauth/access_token"
    userinfo_url = "https://api.github.com/user"
    provider = "github"
    scope = "read:user user:email"

    def __init__(
        self,
        client_id,
        request,
        client_secret=None,
        code=None,
    ):
        redirect_uri = (
            f"{request.scheme}://{request.get_host()}/auth/callback/github/"
        )
        auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope={self.scope}"
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
        return super().validate_user()

    def get_user_token(self):
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": self.code,
            "redirect_uri": self.redirect_uri,
        }
        token_response = super().get_user_token(
            data=data, headers={"Accept": "application/json"}
        )
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

    def __get_email(self, headers):
        # Github does not provide email in user response
        emails_url = "https://api.github.com/user/emails"
        emails_response = requests.get(emails_url, headers=headers).json()
        email = next(
            (email["email"] for email in emails_response if email["primary"]),
            None,
        )
        return email

    def get_user_response(self):
        user_info_response = super().get_user_response()
        headers = {
            "Authorization": f"Bearer {self.token_data.get('access_token')}",
            "Accept": "application/json",
        }
        email = self.__get_email(headers=headers)
        data = {
            "email": email,
            "user": {
                "provider_id": user_info_response.get("id"),
                "email": email,
                "avatar": user_info_response.get("avatar_url"),
                "first_name": user_info_response.get("name"),
                "last_name": user_info_response.get("family_name"),
            },
        }
        self.set_user_data(data=data)
        return

    def complete_login(self):
        return super().complete_login()

    def complete_signup(self):
        return super().complete_signup()
