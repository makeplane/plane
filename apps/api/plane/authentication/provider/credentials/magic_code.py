# Python imports
import os
import secrets
from datetime import timedelta

# Django imports
from django.utils import timezone

# Module imports
from plane.authentication.adapter.credential import CredentialAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.db.models import User, MagicLink


class MagicCodeProvider(CredentialAdapter):
    """
    Magic code authentication provider using PostgreSQL storage.

    This replaces Redis-based magic link storage for simplified infrastructure.
    """

    provider = "magic-code"

    def __init__(self, request, key, code=None, callback=None):
        (EMAIL_HOST, ENABLE_MAGIC_LINK_LOGIN) = get_configuration_value(
            [
                {"key": "EMAIL_HOST", "default": os.environ.get("EMAIL_HOST")},
                {
                    "key": "ENABLE_MAGIC_LINK_LOGIN",
                    "default": os.environ.get("ENABLE_MAGIC_LINK_LOGIN", "1"),
                },
            ]
        )

        if not (EMAIL_HOST):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SMTP_NOT_CONFIGURED"],
                error_message="SMTP_NOT_CONFIGURED",
                payload={"email": str(key)},
            )

        if ENABLE_MAGIC_LINK_LOGIN == "0":
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["MAGIC_LINK_LOGIN_DISABLED"],
                error_message="MAGIC_LINK_LOGIN_DISABLED",
                payload={"email": str(key)},
            )

        super().__init__(request=request, provider=self.provider, callback=callback)
        self.key = key
        self.code = code

    def initiate(self):
        """Generate and store a magic link token."""
        # Generate a random 6-digit token
        token = str(secrets.randbelow(900000) + 100000)
        key = "magic_" + str(self.key)
        email = str(self.key)

        # Check for existing magic link
        existing_link = MagicLink.objects.filter(key=key).first()

        if existing_link:
            # Check if too many attempts
            if existing_link.current_attempt > 2:
                if User.objects.filter(email=email).exists():
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES["EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN"],
                        error_message="EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN",
                        payload={"email": str(email)},
                    )
                else:
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES["EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP"],
                        error_message="EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP",
                        payload={"email": email},
                    )

            # Update existing link with new token and increment attempt
            existing_link.token = token
            existing_link.current_attempt += 1
            existing_link.expires_at = timezone.now() + timedelta(minutes=10)
            existing_link.save()
        else:
            # Create new magic link
            MagicLink.objects.create(
                key=key,
                email=email,
                token=token,
                current_attempt=0,
                expires_at=timezone.now() + timedelta(minutes=10),
            )

        return key, token

    def set_user_data(self):
        """Verify the magic code and set user data."""
        try:
            link = MagicLink.objects.get(key=self.key)
        except MagicLink.DoesNotExist:
            # Link doesn't exist - expired or never created
            email = str(self.key).replace("magic_", "", 1)
            if User.objects.filter(email=email).exists():
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["EXPIRED_MAGIC_CODE_SIGN_IN"],
                    error_message="EXPIRED_MAGIC_CODE_SIGN_IN",
                    payload={"email": str(email)},
                )
            else:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["EXPIRED_MAGIC_CODE_SIGN_UP"],
                    error_message="EXPIRED_MAGIC_CODE_SIGN_UP",
                    payload={"email": str(email)},
                )

        # Check if expired
        if link.is_expired:
            link.delete()
            email = str(self.key).replace("magic_", "", 1)
            if User.objects.filter(email=email).exists():
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["EXPIRED_MAGIC_CODE_SIGN_IN"],
                    error_message="EXPIRED_MAGIC_CODE_SIGN_IN",
                    payload={"email": str(email)},
                )
            else:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["EXPIRED_MAGIC_CODE_SIGN_UP"],
                    error_message="EXPIRED_MAGIC_CODE_SIGN_UP",
                    payload={"email": str(email)},
                )

        # Verify token
        if str(link.token) == str(self.code):
            super().set_user_data(
                {
                    "email": link.email,
                    "user": {
                        "avatar": "",
                        "first_name": "",
                        "last_name": "",
                        "provider_id": "",
                        "is_password_autoset": True,
                    },
                }
            )
            # Delete the token after successful verification
            link.delete()
            return
        else:
            # Invalid code
            email = str(self.key).replace("magic_", "", 1)
            if User.objects.filter(email=email).exists():
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["INVALID_MAGIC_CODE_SIGN_IN"],
                    error_message="INVALID_MAGIC_CODE_SIGN_IN",
                    payload={"email": str(email)},
                )
            else:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["INVALID_MAGIC_CODE_SIGN_UP"],
                    error_message="INVALID_MAGIC_CODE_SIGN_UP",
                    payload={"email": str(email)},
                )
