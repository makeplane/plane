# Python imports
import os
from urllib.parse import urlencode

# Django imports
from django.contrib.auth import logout
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect
from django.middleware.csrf import get_token
from django.utils.encoding import (
    DjangoUnicodeDecodeError,
    smart_bytes,
    smart_str,
)
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views import View

## Third Party Imports
# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

## Module imports
from plane.app.serializers import (
    ChangePasswordSerializer,
    UserSerializer,
)
from plane.authentication.utils.login import user_login
from plane.authentication.utils.workspace_project_join import (
    process_workspace_project_invitations,
)
from plane.bgtasks.forgot_password_task import forgot_password
from plane.db.models import User
from plane.license.models import Instance
from plane.license.utils.instance_value import get_configuration_value


class EmailCheckEndpoint(APIView):

    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email", False)
        existing_user = User.objects.filter(email=email).first()

        if existing_user:
            return Response(
                {
                    "existing_user": True,
                    "is_password_autoset": existing_user.is_password_autoset,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "existing_user": False,
                "is_password_autoset": False,
            },
            status=status.HTTP_200_OK,
        )


class SignOutAuthEndpoint(View):

    def post(self, request):
        logout(request)
        url = (
            request.META.get("HTTP_REFERER", "/")
            + "?"
            + urlencode({"success": "true"})
        )
        return HttpResponseRedirect(url)


class CSRFTokenEndpoint(APIView):

    permission_classes = [
        AllowAny,
    ]

    def get(self, request):
        # Generate a CSRF token
        csrf_token = get_token(request)
        # Return the CSRF token in a JSON response
        return Response(
            {"csrf_token": str(csrf_token)}, status=status.HTTP_200_OK
        )


def generate_password_token(user):
    uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
    token = PasswordResetTokenGenerator().make_token(user)

    return uidb64, token


class ForgotPasswordEndpoint(APIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        email = request.data.get("email")

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        (EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD) = (
            get_configuration_value(
                [
                    {
                        "key": "EMAIL_HOST",
                        "default": os.environ.get("EMAIL_HOST"),
                    },
                    {
                        "key": "EMAIL_HOST_USER",
                        "default": os.environ.get("EMAIL_HOST_USER"),
                    },
                    {
                        "key": "EMAIL_HOST_PASSWORD",
                        "default": os.environ.get("EMAIL_HOST_PASSWORD"),
                    },
                ]
            )
        )

        if not (EMAIL_HOST and EMAIL_HOST_USER and EMAIL_HOST_PASSWORD):
            return Response(
                {"error": "SMTP is not configured. Please contact your admin"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {"error": "Please enter a valid email"},
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
        return Response(
            {"error": "Please check the email"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class ResetPasswordEndpoint(View):

    def post(self, request, uidb64, token):
        try:
            referer = request.META.get("HTTP_REFERER", "/")
            # Decode the id from the uidb64
            id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            # check if the token is valid for the user
            if not PasswordResetTokenGenerator().check_token(user, token):
                url = referer + "?" + urlencode({"error": "Token is invalid"})
                return HttpResponseRedirect(url)

            new_password = request.POST.get("new_password")
            # set_password also hashes the password that the user will get
            user.set_password(new_password)
            user.is_password_autoset = False
            user.save()

            # Generate access token for the user
            user_login(request=request, user=user)
            process_workspace_project_invitations(user=user)
            url = referer + "?" + urlencode({"success": "true"})
            return HttpResponseRedirect(url)
        except DjangoUnicodeDecodeError:
            url = (
                referer
                + "?"
                + urlencode(
                    {"error": "token is not valid, please check the new one"}
                )
            )
            return HttpResponseRedirect(url)


class ChangePasswordEndpoint(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        user = User.objects.get(pk=request.user.id)
        if serializer.is_valid():
            if not user.check_password(serializer.data.get("old_password")):
                return Response(
                    {"error": "Old password is not correct"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # set_password also hashes the password that the user will get
            user.set_password(serializer.data.get("new_password"))
            user.is_password_autoset = False
            user.save()
            return Response(
                {"message": "Password updated successfully"},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SetUserPasswordEndpoint(APIView):
    def post(self, request):
        user = User.objects.get(pk=request.user.id)
        password = request.data.get("password", False)

        # If the user password is not autoset then return error
        if not user.is_password_autoset:
            return Response(
                {
                    "error": "Your password is already set please change your password from profile"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check password validation
        if not password and len(str(password)) < 8:
            return Response(
                {"error": "Password is not valid"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Set the user password
        user.set_password(password)
        user.is_password_autoset = False
        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
