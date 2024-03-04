# Python imports
import uuid

import requests

# Django imports
from django.utils import timezone

# Third party imports
from plane.db.models import Account, Profile, User


class Adapter:
    """Common interface for all auth providers"""

    def __init__(self, request, provider):
        self.request = request
        self.provider = provider
        self.token_data = None
        self.user_data = None

    def get_user_token(self, data, headers=None):
        raise NotImplementedError

    def get_user_response(self):
        raise NotImplementedError

    def set_token_data(self, data):
        self.token_data = data

    def set_user_data(self, data):
        self.user_data = data

    def create_update_account(self, user):
        raise NotImplementedError

    def authenticate(self):
        raise NotImplementedError

    def complete_login_or_signup(self, is_signup=False):
        email = self.user_data.get("email")
        user_query = User.objects.filter(email=email)
        user = user_query.first()

        if is_signup or not user:
            user = User(email=email, username=uuid.uuid4().hex)
            user.set_password(uuid.uuid4().hex)
            user.avatar = self.user_data.get("user").get("avatar", "")
            user.first_name = self.user_data.get("user").get("first_name", "")
            user.last_name = self.user_data.get("user").get("last_name", "")
            user.save()
            Profile.objects.create(user=user)

        # Update user details
        user.last_login_medium = self.provider
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = self.request.META.get("REMOTE_ADDR")
        user.last_login_uagent = self.request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save()

        if self.token_data:
            self.create_update_account(user=user)

        return user


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
    ):
        super().__init__(request, provider)
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
        return User.objects.filter(
            email=self.user_data.get("email")
        ).first(), self.user_data.get("email")

    def get_user_token(self, data, headers=None):
        headers = headers or {}
        response = requests.post(
            self.get_token_url(), data=data, headers=headers
        )
        response.raise_for_status()
        return response.json()

    def get_user_response(self):
        headers = {
            "Authorization": f"Bearer {self.token_data.get('access_token')}"
        }
        response = requests.get(self.get_user_info_url(), headers=headers)
        response.raise_for_status()
        return response.json()

    def set_user_data(self, data):
        self.user_data = data

    def create_update_account(self, user):
        print(self.user_data)
        account, created = Account.objects.update_or_create(
            user=user,
            provider=self.provider,
            defaults={
                "provider_account_id": self.user_data.get("user").get("provider_id"),
                "access_token": self.token_data.get("access_token"),
                "refresh_token": self.token_data.get("refresh_token", None),
                "access_token_expired_at": self.token_data.get(
                    "access_token_expired_at"
                ),
                "refresh_token_expired_at": self.token_data.get(
                    "refresh_token_expired_at"
                ),
                "last_connected_at": timezone.now(),
            },
        )


class CredentialAdapter(Adapter):
    """Common interface for all credential providers"""

    def __init__(self, request, provider):
        self.request = request
        self.provider = provider
        self.token_data = None
        self.user_data = None

    def authenticate(self):
        raise NotImplementedError
