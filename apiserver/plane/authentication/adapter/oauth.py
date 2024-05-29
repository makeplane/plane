# Python imports
import requests

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import Account

from .base import Adapter
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)


class OauthAdapter(Adapter):
    def __init__(
        self,
        request,
        provider,
        client_id,
        scope,
        redirect_uri,
        auth_url,
        token_url,
        userinfo_url,
        client_secret=None,
        code=None,
        callback=None,
    ):
        super().__init__(request=request, provider=provider, callback=callback)
        self.client_id = client_id
        self.scope = scope
        self.redirect_uri = redirect_uri
        self.auth_url = auth_url
        self.token_url = token_url
        self.userinfo_url = userinfo_url
        self.client_secret = client_secret
        self.code = code

    def get_auth_url(self):
        return self.auth_url

    def get_token_url(self):
        return self.token_url

    def get_user_info_url(self):
        return self.userinfo_url

    def authenticate(self):
        self.set_token_data()
        self.set_user_data()
        return self.complete_login_or_signup()

    def get_user_token(self, data, headers=None):
        try:
            headers = headers or {}
            response = requests.post(
                self.get_token_url(), data=data, headers=headers
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            code = (
                "GOOGLE_OAUTH_PROVIDER_ERROR"
                if self.provider == "google"
                else "GITHUB_OAUTH_PROVIDER_ERROR"
            )
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[code],
                error_message=str(code),
            )

    def get_user_response(self):
        try:
            headers = {
                "Authorization": f"Bearer {self.token_data.get('access_token')}"
            }
            response = requests.get(self.get_user_info_url(), headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            code = (
                "GOOGLE_OAUTH_PROVIDER_ERROR"
                if self.provider == "google"
                else "GITHUB_OAUTH_PROVIDER_ERROR"
            )
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[code],
                error_message=str(code),
            )

    def set_user_data(self, data):
        self.user_data = data

    def create_update_account(self, user):
        account, created = Account.objects.update_or_create(
            user=user,
            provider=self.provider,
            defaults={
                "provider_account_id": self.user_data.get("user").get(
                    "provider_id"
                ),
                "access_token": self.token_data.get("access_token"),
                "refresh_token": self.token_data.get("refresh_token", None),
                "access_token_expired_at": self.token_data.get(
                    "access_token_expired_at"
                ),
                "refresh_token_expired_at": self.token_data.get(
                    "refresh_token_expired_at"
                ),
                "last_connected_at": timezone.now(),
                "id_token": self.token_data.get("id_token", ""),
            },
        )
