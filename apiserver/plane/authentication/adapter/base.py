# Python imports
import os
import uuid

# Django imports
from django.utils import timezone

# Third party imports
from zxcvbn import zxcvbn

# Module imports
from plane.db.models import (
    Profile,
    User,
    WorkspaceMemberInvite,
)
from plane.license.utils.instance_value import get_configuration_value
from .error import AuthenticationException, AUTHENTICATION_ERROR_CODES


class Adapter:
    """Common interface for all auth providers"""

    def __init__(self, request, provider, callback=None):
        self.request = request
        self.provider = provider
        self.callback = callback
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

    def complete_login_or_signup(self):
        email = self.user_data.get("email")
        user = User.objects.filter(email=email).first()
        # Check if sign up case or login
        is_signup = bool(user)
        if not user:
            # New user
            (ENABLE_SIGNUP,) = get_configuration_value(
                [
                    {
                        "key": "ENABLE_SIGNUP",
                        "default": os.environ.get("ENABLE_SIGNUP", "1"),
                    },
                ]
            )
            if (
                ENABLE_SIGNUP == "0"
                and not WorkspaceMemberInvite.objects.filter(
                    email=email,
                ).exists()
            ):
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["SIGNUP_DISABLED"],
                    error_message="SIGNUP_DISABLED",
                    payload={"email": email},
                )
            user = User(email=email, username=uuid.uuid4().hex)

            if self.user_data.get("user").get("is_password_autoset"):
                user.set_password(uuid.uuid4().hex)
                user.is_password_autoset = True
                user.is_email_verified = True
            else:
                # Validate password
                results = zxcvbn(self.code)
                if results["score"] < 3:
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES[
                            "INVALID_PASSWORD"
                        ],
                        error_message="INVALID_PASSWORD",
                        payload={"email": email},
                    )

                user.set_password(self.code)
                user.is_password_autoset = False

            avatar = self.user_data.get("user", {}).get("avatar", "")
            first_name = self.user_data.get("user", {}).get("first_name", "")
            last_name = self.user_data.get("user", {}).get("last_name", "")
            user.avatar = avatar if avatar else ""
            user.first_name = first_name if first_name else ""
            user.last_name = last_name if last_name else ""
            user.save()
            Profile.objects.create(user=user)

        if not user.is_active:
            raise AuthenticationException(
                AUTHENTICATION_ERROR_CODES["USER_ACCOUNT_DEACTIVATED"],
                error_message="USER_ACCOUNT_DEACTIVATED",
            )

        # Update user details
        user.last_login_medium = self.provider
        user.last_active = timezone.now()
        user.last_login_time = timezone.now()
        user.last_login_ip = self.request.META.get("REMOTE_ADDR")
        user.last_login_uagent = self.request.META.get("HTTP_USER_AGENT")
        user.token_updated_at = timezone.now()
        user.save()

        if self.callback:
            self.callback(
                user,
                is_signup,
                self.request,
            )

        if self.token_data:
            self.create_update_account(user=user)

        return user
