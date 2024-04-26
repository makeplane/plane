# Module imports
from plane.authentication.adapter.base import AuthenticationException
from plane.authentication.adapter.credential import CredentialAdapter
from plane.db.models import User


class EmailProvider(CredentialAdapter):

    provider = "email"

    def __init__(
        self,
        request,
        key=None,
        code=None,
        is_signup=False,
    ):
        super().__init__(request, self.provider)
        self.key = key
        self.code = code
        self.is_signup = is_signup

    def set_user_data(self):
        if self.is_signup:
            # Check if the user already exists
            if User.objects.filter(email=self.key).exists():
                raise AuthenticationException(
                    error_message="User with this email already exists",
                    error_code="USER_ALREADY_EXIST",
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
            user = User.objects.filter(
                email=self.key,
            ).first()
            # Existing user
            if not user:
                raise AuthenticationException(
                    error_message="Sorry, we could not find a user with the provided credentials. Please try again.",
                    error_code="AUTHENTICATION_FAILED",
                )

            # Check user password
            if not user.check_password(self.code):
                raise AuthenticationException(
                    error_message="Sorry, we could not find a user with the provided credentials. Please try again.",
                    error_code="AUTHENTICATION_FAILED",
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
