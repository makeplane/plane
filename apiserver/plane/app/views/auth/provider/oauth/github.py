# Python imports
from datetime import datetime

import pytz
import requests

# Module imports
from plane.app.views.auth.adapter.oauth import OauthAdapter


class GitHubOAuthProvider(OauthAdapter):

    token_url = "https://github.com/login/oauth/access_token"
    userinfo_url = "https://api.github.com/user"
    provider = "github"
    scope = "read:user user:email"

    def __init__(self, request, client_id, client_secret=None, code=None):
        redirect_uri = (
            f"{request.scheme}://{request.get_host()}/auth/callback/github/"
        )
        auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope={self.scope}"
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
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": self.code,
            "redirect_uri": self.redirect_uri,
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

    def __get_email(self, headers):
        # Github does not provide email in user response
        emails_url = "https://api.github.com/user/emails"
        emails_response = requests.get(emails_url, headers=headers).json()
        email = next(
            (email["email"] for email in emails_response if email["primary"]),
            None,
        )
        return email

    def set_user_data(self):
        user_info_response = self.get_user_response()
        headers = {
            "Authorization": f"Bearer {self.token_data.get('access_token')}",
            "Accept": "application/json",
        }
        email = self.__get_email(headers=headers)
        super().set_user_data(
            {
                "email": email,
                "user": {
                    "provider_id": user_info_response.get("id"),
                    "email": email,
                    "avatar": user_info_response.get("avatar_url"),
                    "first_name": user_info_response.get("name"),
                    "last_name": user_info_response.get("family_name"),
                },
            }
        )
