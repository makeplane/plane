# Python imports
import uuid
from datetime import datetime

import pytz
import requests

# Django imports
from django.utils import timezone

# Third party imports
from plane.db.models import Account, Profile, User


class Adapter:

    user = None

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
    ):
        self.request = request
        self.provider = provider
        self.client_id = client_id
        self.scope = scope
        self.redirect_uri = redirect_uri
        self.client_secret = client_secret
        self.auth_url = auth_url
        self.token_url = token_url
        self.userinfo_url = userinfo_url
        self.code = code
        self.token_data = None
        self.user_data = None

    def get_auth_url(self):
        return str(self.auth_url)

    def get_token_url(self):
        return str(self.token_url)

    def get_user_info_url(self):
        return str(self.userinfo_url)

    def get_user_token(self, data, headers={}):
        url = self.get_token_url()
        response = requests.post(url, data=data, headers=headers)
        response.raise_for_status()
        return response.json()

    def set_token_data(self, data):
        self.token_data = data

    def get_user_response(self):
        headers = {"Authorization": f"Bearer {self.token_data.get('access_token')}"}
        response = requests.get(
            self.get_user_info_url(), headers=headers
        )
        response.raise_for_status()
        return response.json()

    def set_user_data(self, data):
        self.user_data = data

    def create_update_account(self, user):
        # Get or create the user account
        account, created = Account.objects.get_or_create(
            user=user,
            provider=self.provider,
            defaults={
                "provider_account_id": self.user_data.get("provider_id"),
                "access_token": self.token_data.get("access_token"),
                "refresh_token": self.token_data.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.fromtimestamp(
                        self.token_data.get("expires_in"),
                        tz=pytz.utc,
                    )
                    if self.token_data.get("expires_in")
                    else None
                ),
                "refresh_token_expired_at": (
                    datetime.fromtimestamp(
                        self.token_data.get("refresh_token_expired_at"),
                        tz=pytz.utc,
                    )
                    if self.token_data.get("refresh_token_expired_at")
                    else None
                ),
            },
        )
        if not created:
            # account access and refresh token
            account.access_token = self.token_data.get("access_token")
            account.access_token_expired_at = (
                datetime.fromtimestamp(
                    self.token_data.get("expires_in"),
                    tz=pytz.utc,
                )
                if self.token_data.get("expires_in")
                else None
            )
            account.metadata = self.token_data.get("metadata", {})
        account.last_connected_at = timezone.now()
        account.save()
        return

    def validate_user(self):
        self.get_user_token()
        self.get_user_response()
        email = self.user_data.get("email")
        self.user = User.objects.filter(email=email).first()
        return self.user

    def complete_login(self):
        user = User.objects.filter(email=self.user_data.get("email")).first()

        if self.token_data:
            self.create_update_account(user=user)

        # Update user creds
        user.last_login_medium = self.provider
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = self.request.META.get("REMOTE_ADDR")
        user.last_login_uagent = self.request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save()
        return user

    def complete_signup(self):
        user = User.objects.create(
            email=self.user_data.get("email"),
            username=uuid.uuid4().hex,
        )
        user.set_password(uuid.uuid4().hex)
        user.save()
        # Create profile
        _ = Profile.objects.create(user=user)

        if self.token_data:
            self.create_update_account(user=user)
        # User
        user.last_login_medium = self.provider
        user.avatar = self.user_data.get("avatar")
        user.first_name = self.user_data.get("first_name")
        user.last_name = self.user_data.get("last_name")
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = self.request.META.get("REMOTE_ADDR")
        user.last_login_uagent = self.request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save()
        return user
