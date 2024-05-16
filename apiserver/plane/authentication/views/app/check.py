# Django imports
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

## Module imports
from plane.db.models import User
from plane.license.models import Instance
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)


class EmailCheckSignUpEndpoint(APIView):

    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        try:
            # Check instance configuration
            instance = Instance.objects.first()
            if instance is None or not instance.is_setup_done:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES[
                        "INSTANCE_NOT_CONFIGURED"
                    ],
                    error_message="INSTANCE_NOT_CONFIGURED",
                )
            email = request.data.get("email", False)

            # Return error if email is not present
            if not email:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["EMAIL_REQUIRED"],
                    error_message="EMAIL_REQUIRED",
                )

            # Validate email
            validate_email(email)

            existing_user = User.objects.filter(email=email).first()

            if existing_user:
                # check if the account is the deactivated
                if not existing_user.is_active:
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES[
                            "USER_ACCOUNT_DEACTIVATED"
                        ],
                        error_message="USER_ACCOUNT_DEACTIVATED",
                    )

                # Raise user already exist
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES[
                        "USER_ALREADY_EXIST"
                    ],
                    error_message="USER_ALREADY_EXIST",
                )
            return Response(
                {"status": True},
                status=status.HTTP_200_OK,
            )
        except ValidationError:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL"],
                error_message="INVALID_EMAIL",
            )
        except AuthenticationException as e:
            return Response(
                e.get_error_dict(), status=status.HTTP_400_BAD_REQUEST
            )


class EmailCheckSignInEndpoint(APIView):

    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        try:
            # Check instance configuration
            instance = Instance.objects.first()
            if instance is None or not instance.is_setup_done:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES[
                        "INSTANCE_NOT_CONFIGURED"
                    ],
                    error_message="INSTANCE_NOT_CONFIGURED",
                )

            email = request.data.get("email", False)

            # Return error if email is not present
            if not email:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["EMAIL_REQUIRED"],
                    error_message="EMAIL_REQUIRED",
                )

            # Validate email
            validate_email(email)

            existing_user = User.objects.filter(email=email).first()

            # If existing user
            if existing_user:
                # Raise different exception when user is not active
                if not existing_user.is_active:
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES[
                            "USER_ACCOUNT_DEACTIVATED"
                        ],
                        error_message="USER_ACCOUNT_DEACTIVATED",
                    )
                # Return true
                return Response(
                    {
                        "status": True,
                        "is_password_autoset": existing_user.is_password_autoset,
                    },
                    status=status.HTTP_200_OK,
                )

            # Raise error
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_DOES_NOT_EXIST"],
                error_message="USER_DOES_NOT_EXIST",
            )
        except ValidationError:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL"],
                error_message="INVALID_EMAIL",
            )
        except AuthenticationException as e:
            return Response(
                e.get_error_dict(), status=status.HTTP_400_BAD_REQUEST
            )
