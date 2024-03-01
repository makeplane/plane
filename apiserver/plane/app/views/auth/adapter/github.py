# Python imports
from datetime import datetime

import pytz
import requests

# Module imports
from .provider import Provider


class GithubAuthProvider(Provider):

    def __init__(
        self,
        client_id,
        request,
        client_secret=None,
    ):
        scope = "read:user user:email"
        redirect_uri = (
            f"{request.scheme}://{request.get_host()}/auth/callback/github/"
        )
        provider = "github"
        super().__init__(
            request=request,
            provider=provider,
            client_id=client_id,
            scope=scope,
            redirect_uri=redirect_uri,
            client_secret=client_secret,
        )

    def get_auth_url(self):
        return f"https://github.com/login/oauth/authorize?client_id={self.client_id}&redirect_uri={self.redirect_uri}&scope={self.scope}"

    def get_token_url(self):
        return "https://github.com/login/oauth/access_token"

    def get_user_info_url(self):
        return "https://api.github.com/user"

    def complete_login(self, user, provider_response):
        return super().complete_login(user, provider_response)

    def get_user_token(self, code):
        url = self.get_token_url()
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri,
        }
        headers = {"Accept": "application/json"}
        token_response = requests.post(url, data=data, headers=headers)
        token_response = token_response.json()
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
        headers = {
            "Authorization": f"Bearer {token_data.get('access_token')}",
            "Accept": "application/json",
        }
        user_info_response = requests.get(
            self.get_user_info_url(), headers=headers
        ).json()

        # Github does not provide email in user response
        emails_url = "https://api.github.com/user/emails"
        emails_response = requests.get(emails_url, headers=headers).json()
        email = next(
            (email["email"] for email in emails_response if email["primary"]),
            None,
        )

        return {
            "email": email,
            "user": {
                "provider_id": user_info_response.get("id"),
                "email": email,
                "avatar": user_info_response.get("avatar_url"),
                "first_name": user_info_response.get("name"),
                "last_name": user_info_response.get("family_name"),
            },
            "token": token_data,
        }
