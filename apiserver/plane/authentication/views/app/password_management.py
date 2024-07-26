# Python imports
import os
from urllib.parse import urlencode, urljoin

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from zxcvbn import zxcvbn

# Django imports
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.utils.encoding import (
    DjangoUnicodeDecodeError,
    smart_bytes,
    smart_str,
)
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views import View

# Module imports
from plane.bgtasks.forgot_password_task import forgot_password
from plane.license.models import Instance
from plane.db.models import User
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.authentication.rate_limit import AuthenticationThrottle

def generate_password_token(user):
    uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
    token = PasswordResetTokenGenerator().make_token(user)

    return uidb64, token


class ForgotPasswordEndpoint(APIView):
    permission_classes = [
        AllowAny,
    ]

    throttle_classes = [
        AuthenticationThrottle,
    ]

    def post(self, request):
        email = request.data.get("email")

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

        (EMAIL_HOST,) = get_configuration_value(
            [
                {
                    "key": "EMAIL_HOST",
                    "default": os.environ.get("EMAIL_HOST"),
                },
            ]
        )

        if not (EMAIL_HOST):
            exc = AuthenticationException(
                error_message="SMTP_NOT_CONFIGURED",
                error_code=AUTHENTICATION_ERROR_CODES["SMTP_NOT_CONFIGURED"],
            )
            return Response(
                exc.get_error_dict(),
                status=status.HTTP_400_BAD_REQUEST,
            )

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

        # Get the user
        user = User.objects.filter(email=email).first()
        if user:
            # Get the reset token for user
            uidb64, token = generate_password_token(user=user)
            current_site = request.META.get("HTTP_ORIGIN")
            # send the forgot password email
            forgot_password.delay(
                user.first_name, user.email, uidb64, token, current_site
            )
            return Response(
                {"message": "Check your email to reset your password"},
                status=status.HTTP_200_OK,
            )
        exc = AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["USER_DOES_NOT_EXIST"],
            error_message="USER_DOES_NOT_EXIST",
        )
        return Response(
            exc.get_error_dict(),
            status=status.HTTP_400_BAD_REQUEST,
        )


class ResetPasswordEndpoint(View):

    def post(self, request, uidb64, token):
        try:
            # Decode the id from the uidb64
            id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            # check if the token is valid for the user
            if not PasswordResetTokenGenerator().check_token(user, token):
                exc = AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES[
                        "INVALID_PASSWORD_TOKEN"
                    ],
                    error_message="INVALID_PASSWORD_TOKEN",
                )
                params = exc.get_error_dict()
                url = urljoin(
                    base_host(request=request, is_app=True),
                    "accounts/reset-password?" + urlencode(params),
                )
                return HttpResponseRedirect(url)

            password = request.POST.get("password", False)

            if not password:
                exc = AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["INVALID_PASSWORD"],
                    error_message="INVALID_PASSWORD",
                )
                url = urljoin(
                    base_host(request=request, is_app=True),
                    "accounts/reset-password?"
                    + urlencode(exc.get_error_dict()),
                )
                return HttpResponseRedirect(url)

            # Check the password complexity
            results = zxcvbn(password)
            if results["score"] < 3:
                exc = AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["INVALID_PASSWORD"],
                    error_message="INVALID_PASSWORD",
                )
                url = urljoin(
                    base_host(request=request, is_app=True),
                    "accounts/reset-password?"
                    + urlencode(exc.get_error_dict()),
                )
                return HttpResponseRedirect(url)

            # set_password also hashes the password that the user will get
            user.set_password(password)
            user.is_password_autoset = False
            user.save()

            url = urljoin(
                base_host(request=request, is_app=True),
                "sign-in?" + urlencode({"success": True}),
            )
            return HttpResponseRedirect(url)
        except DjangoUnicodeDecodeError:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "EXPIRED_PASSWORD_TOKEN"
                ],
                error_message="EXPIRED_PASSWORD_TOKEN",
            )
            url = urljoin(
                base_host(request=request, is_app=True),
                "accounts/reset-password?" + urlencode(exc.get_error_dict()),
            )
            return HttpResponseRedirect(url)
