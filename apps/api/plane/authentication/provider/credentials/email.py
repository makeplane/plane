# Python imports
import os
from typing import Optional, Callable

# Module imports
from plane.authentication.adapter.credential import CredentialAdapter
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.db.models import User
from plane.license.utils.instance_value import get_configuration_value


class EmailProvider(CredentialAdapter):
    provider = "email"

    def __init__(
        self,
        request,
        key: Optional[str] = None,
        code: Optional[str] = None,
        is_signup: Optional[bool] = False,
        callback: Optional[Callable] = None,
        invitation_id: Optional[str] = None,
    ):
        super().__init__(request=request, provider=self.provider, callback=callback)
        self.key = key
        self.code = code
        self.is_signup = is_signup

        (ENABLE_EMAIL_PASSWORD,) = get_configuration_value(
            [
                {
                    "key": "ENABLE_EMAIL_PASSWORD",
                    "default": os.environ.get("ENABLE_EMAIL_PASSWORD"),
                }
            ]
        )

        if ENABLE_EMAIL_PASSWORD == "0":
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "EMAIL_PASSWORD_AUTHENTICATION_DISABLED"
                ],
                error_message="EMAIL_PASSWORD_AUTHENTICATION_DISABLED",
            )

        self.exception_payload = {
            "email": self.key,
        }
        if invitation_id:
            self.exception_payload["invitation_id"] = invitation_id

    def set_user_data(self):
        if self.is_signup:
            # Check if the user already exists
            if User.objects.filter(email=self.key).exists():
                raise AuthenticationException(
                    error_message="USER_ALREADY_EXIST",
                    error_code=AUTHENTICATION_ERROR_CODES["USER_ALREADY_EXIST"],
                )

            super().set_user_data(
                {
                    "email": self.key,
                    "user": {
                        "avatar": "",
                        "first_name": "",
                        "last_name": "",
                        "provider_id": "",
                        "is_password_autoset": False,
                    },
                }
            )
            return
        else:
            user = User.objects.filter(email=self.key).first()

            # User does not exists
            if not user:
                raise AuthenticationException(
                    error_message="USER_DOES_NOT_EXIST",
                    error_code=AUTHENTICATION_ERROR_CODES["USER_DOES_NOT_EXIST"],
                    payload=self.exception_payload,
                )

            # Check user password
            if not user.check_password(self.code):
                raise AuthenticationException(
                    error_message=(
                        "AUTHENTICATION_FAILED_SIGN_UP"
                        if self.is_signup
                        else "AUTHENTICATION_FAILED_SIGN_IN"
                    ),
                    error_code=AUTHENTICATION_ERROR_CODES[
                        (
                            "AUTHENTICATION_FAILED_SIGN_UP"
                            if self.is_signup
                            else "AUTHENTICATION_FAILED_SIGN_IN"
                        )
                    ],
                    payload=self.exception_payload,
                )

            super().set_user_data(
                {
                    "email": self.key,
                    "user": {
                        "avatar": "",
                        "first_name": "",
                        "last_name": "",
                        "provider_id": "",
                        "is_password_autoset": False,
                    },
                }
            )
            return
