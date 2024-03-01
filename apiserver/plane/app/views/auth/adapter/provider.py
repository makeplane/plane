# Python imports
import uuid
from datetime import datetime

import pytz

# Django imports
from django.utils import timezone

# Third party imports
from plane.db.models import Account, Profile, User


class Provider:

    def __init__(
        self,
        request,
        provider,
        client_id,
        scope,
        redirect_uri,
        client_secret=None,
    ):
        self.request = request
        self.provider = provider
        self.client_id = client_id
        self.scope = scope
        self.redirect_uri = redirect_uri
        self.client_secret = client_secret
        self.user = None

    def get_auth_url(self):
        pass

    def get_token_url(self):
        pass

    def get_user_token(self):
        pass

    def get_user_info_url(self):
        pass

    def get_user_response(self):
        pass

    def complete_login(self, user, provider_response):
        user_data, token_data = provider_response.get(
            "user"
        ), provider_response.get("token")
        # Get or create the user account
        account, created = Account.objects.get_or_create(
            user=user,
            provider=self.provider,
            defaults={
                "provider_account_id": user_data.get("provider_id"),
                "access_token": token_data.get("access_token"),
                "refresh_token": token_data.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.fromtimestamp(
                        token_data.get("expires_in"),
                        tz=pytz.utc,
                    )
                    if token_data.get("expires_in")
                    else None
                ),
                "refresh_token_expired_at": (
                    datetime.fromtimestamp(
                        token_data.get("refresh_token_expired_at"),
                        tz=pytz.utc,
                    )
                    if token_data.get("refresh_token_expired_at")
                    else None
                ),
            },
        )
        if not created:
            # account access and refresh token
            account.access_token = token_data.get("access_token")
            account.access_token_expired_at = (
                datetime.fromtimestamp(
                    token_data.get("expires_in"),
                    tz=pytz.utc,
                )
                if token_data.get("expires_in")
                else None
            )
            account.metadata = token_data.get("metadata", {})

        # last connected at
        account.last_connected_at = timezone.now()
        account.save()

        # Update user creds
        user.last_login_medium = self.provider
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = self.request.META.get("REMOTE_ADDR")
        user.last_login_uagent = self.request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save()
        return user

    def complete_signup(self, provider_response):
        user_detail, token_detail = provider_response.get(
            "user"
        ), provider_response.get("token")
        user = User.objects.create(
            email=provider_response.get("email"),
            username=uuid.uuid4().hex,
        )
        user.set_password(uuid.uuid4().hex)
        # Create profile
        _ = Profile.objects.create(user=user)

        _ = Account.objects.create(
            user=user,
            provider=self.provider,
            provider_account_id=user_detail.get("provider_id"),
            access_token=token_detail.get("access_token"),
            access_token_expired_at=(
                datetime.fromtimestamp(
                    token_detail.get("expires_in"),
                    tz=pytz.utc,
                )
                if token_detail.get("expires_in")
                else None
            ),
            refresh_token=token_detail.get("refresh_token", None),
            refresh_token_expired_at=(
                datetime.fromtimestamp(
                    token_detail.get("refresh_token_expired_at"),
                    tz=pytz.utc,
                )
                if token_detail.get("refresh_token_expired_at")
                else None
            ),
            metadata=token_detail.get("metadata", {}),
        )
        # User
        user.last_login_medium = self.provider
        user.avatar = user_detail.get("avatar")
        user.first_name = user_detail.get("first_name")
        user.last_name = user_detail.get("last_name")
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = self.request.META.get("REMOTE_ADDR")
        user.last_login_uagent = self.request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save()
