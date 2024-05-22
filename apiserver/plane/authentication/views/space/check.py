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
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


class EmailCheckEndpoint(APIView):

    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "INSTANCE_NOT_CONFIGURED"
                ],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            return Response(
                exc.get_error_dict(),
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email", False)

        # Return error if email is not present
        if not email:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["EMAIL_REQUIRED"],
                error_message="EMAIL_REQUIRED",
            )
            return Response(
                exc.get_error_dict(),
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate email
        try:
            validate_email(email)
        except ValidationError:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL"],
                error_message="INVALID_EMAIL",
            )
            return Response(
                exc.get_error_dict(),
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Check if a user already exists with the given email
        existing_user = User.objects.filter(email=email).first()

        # If existing user
        if existing_user:
            if not existing_user.is_active:
                exc = AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES[
                        "USER_ACCOUNT_DEACTIVATED"
                    ],
                    error_message="USER_ACCOUNT_DEACTIVATED",
                )
                return Response(
                    exc.get_error_dict(), status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {
                    "existing": True,
                    "is_password_autoset": existing_user.is_password_autoset,
                },
                status=status.HTTP_200_OK,
            )
        # Else return response
        return Response(
            {"existing": False, "is_password_autoset": False},
            status=status.HTTP_200_OK,
        )
