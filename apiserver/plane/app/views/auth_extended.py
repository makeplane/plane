## Python imports
import uuid
import os
import json
import random
import string

## Django imports
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import (
    smart_str,
    smart_bytes,
    DjangoUnicodeDecodeError,
)
from django.contrib.auth.hashers import make_password
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings

## Third Party Imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

## Module imports
from . import BaseAPIView
from plane.app.serializers import (
    ChangePasswordSerializer,
    ResetPasswordSerializer,
    UserSerializer,
)
from plane.db.models import User, WorkspaceMemberInvite
from plane.license.utils.instance_value import get_configuration_value
from plane.bgtasks.forgot_password_task import forgot_password
from plane.license.models import Instance
from plane.settings.redis import redis_instance
from plane.bgtasks.magic_link_code_task import magic_link
from plane.bgtasks.event_tracking_task import auth_events


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return (
        str(refresh.access_token),
        str(refresh),
    )


def generate_magic_token(email):
    key = "magic_" + str(email)

    ## Generate a random token
    token = (
        "".join(random.choices(string.ascii_lowercase, k=4))
        + "-"
        + "".join(random.choices(string.ascii_lowercase, k=4))
        + "-"
        + "".join(random.choices(string.ascii_lowercase, k=4))
    )

    # Initialize the redis instance
    ri = redis_instance()

    # Check if the key already exists in python
    if ri.exists(key):
        data = json.loads(ri.get(key))

        current_attempt = data["current_attempt"] + 1

        if data["current_attempt"] > 2:
            return key, token, False

        value = {
            "current_attempt": current_attempt,
            "email": email,
            "token": token,
        }
        expiry = 600

        ri.set(key, json.dumps(value), ex=expiry)

    else:
        value = {"current_attempt": 0, "email": email, "token": token}
        expiry = 600

        ri.set(key, json.dumps(value), ex=expiry)

    return key, token, True


def generate_password_token(user):
    uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
    token = PasswordResetTokenGenerator().make_token(user)

    return uidb64, token


class ForgotPasswordEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        email = request.data.get("email")

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


class ResetPasswordEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request, uidb64, token):
        try:
            # Decode the id from the uidb64
            id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            # check if the token is valid for the user
            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response(
                    {"error": "Token is invalid"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Reset the password
            serializer = ResetPasswordSerializer(data=request.data)
            if serializer.is_valid():
                # set_password also hashes the password that the user will get
                user.set_password(serializer.data.get("new_password"))
                user.is_password_autoset = False
                user.save()

                # Log the user in
                # Generate access token for the user
                access_token, refresh_token = get_tokens_for_user(user)
                data = {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                }

                return Response(data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        except DjangoUnicodeDecodeError as indentifier:
            return Response(
                {"error": "token is not valid, please check the new one"},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class ChangePasswordEndpoint(BaseAPIView):
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


class SetUserPasswordEndpoint(BaseAPIView):
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


class MagicGenerateEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        email = request.data.get("email", False)

        # Check the instance registration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not email:
            return Response(
                {"error": "Please provide a valid email address"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Clean up the email
        email = email.strip().lower()
        validate_email(email)

        # check if the email exists not
        if not User.objects.filter(email=email).exists():
            # Create a user
            _ = User.objects.create(
                email=email,
                username=uuid.uuid4().hex,
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
            )

        ## Generate a random token
        token = (
            "".join(random.choices(string.ascii_lowercase, k=4))
            + "-"
            + "".join(random.choices(string.ascii_lowercase, k=4))
            + "-"
            + "".join(random.choices(string.ascii_lowercase, k=4))
        )

        ri = redis_instance()

        key = "magic_" + str(email)

        # Check if the key already exists in python
        if ri.exists(key):
            data = json.loads(ri.get(key))

            current_attempt = data["current_attempt"] + 1

            if data["current_attempt"] > 2:
                return Response(
                    {
                        "error": "Max attempts exhausted. Please try again later."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            value = {
                "current_attempt": current_attempt,
                "email": email,
                "token": token,
            }
            expiry = 600

            ri.set(key, json.dumps(value), ex=expiry)

        else:
            value = {"current_attempt": 0, "email": email, "token": token}
            expiry = 600

            ri.set(key, json.dumps(value), ex=expiry)

        # If the smtp is configured send through here
        current_site = request.META.get("HTTP_ORIGIN")
        magic_link.delay(email, key, token, current_site)

        return Response({"key": key}, status=status.HTTP_200_OK)


class EmailCheckEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check the instance registration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {"error": "Instance is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get configuration values
        ENABLE_SIGNUP, ENABLE_MAGIC_LINK_LOGIN = get_configuration_value(
            [
                {
                    "key": "ENABLE_SIGNUP",
                    "default": os.environ.get("ENABLE_SIGNUP"),
                },
                {
                    "key": "ENABLE_MAGIC_LINK_LOGIN",
                    "default": os.environ.get("ENABLE_MAGIC_LINK_LOGIN"),
                },
            ]
        )

        email = request.data.get("email", False)

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # validate the email
        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {"error": "Email is not valid"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the user exists
        user = User.objects.filter(email=email).first()
        current_site = request.META.get("HTTP_ORIGIN")

        # If new user
        if user is None:
            # Create the user
            if (
                ENABLE_SIGNUP == "0"
                and not WorkspaceMemberInvite.objects.filter(
                    email=email,
                ).exists()
            ):
                return Response(
                    {
                        "error": "New account creation is disabled. Please contact your site administrator"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create the user with default values
            user = User.objects.create(
                email=email,
                username=uuid.uuid4().hex,
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
            )

            if not bool(
                ENABLE_MAGIC_LINK_LOGIN,
            ):
                return Response(
                    {"error": "Magic link sign in is disabled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Send event
            auth_events.delay(
                user=user.id,
                email=email,
                user_agent=request.META.get("HTTP_USER_AGENT"),
                ip=request.META.get("REMOTE_ADDR"),
                event_name="SIGN_IN",
                medium="MAGIC_LINK",
                first_time=True,
            )
            key, token, current_attempt = generate_magic_token(email=email)
            if not current_attempt:
                return Response(
                    {
                        "error": "Max attempts exhausted. Please try again later."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Trigger the email
            magic_link.delay(email, "magic_" + str(email), token, current_site)
            return Response(
                {
                    "is_password_autoset": user.is_password_autoset,
                    "is_existing": False,
                },
                status=status.HTTP_200_OK,
            )

        # Existing user
        else:
            if user.is_password_autoset:
                ## Generate a random token
                if not bool(ENABLE_MAGIC_LINK_LOGIN):
                    return Response(
                        {"error": "Magic link sign in is disabled."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                auth_events.delay(
                    user=user.id,
                    email=email,
                    user_agent=request.META.get("HTTP_USER_AGENT"),
                    ip=request.META.get("REMOTE_ADDR"),
                    event_name="SIGN_IN",
                    medium="MAGIC_LINK",
                    first_time=False,
                )

                # Generate magic token
                key, token, current_attempt = generate_magic_token(email=email)
                if not current_attempt:
                    return Response(
                        {
                            "error": "Max attempts exhausted. Please try again later."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Trigger the email
                magic_link.delay(email, key, token, current_site)
                return Response(
                    {
                        "is_password_autoset": user.is_password_autoset,
                        "is_existing": True,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                auth_events.delay(
                    user=user.id,
                    email=email,
                    user_agent=request.META.get("HTTP_USER_AGENT"),
                    ip=request.META.get("REMOTE_ADDR"),
                    event_name="SIGN_IN",
                    medium="EMAIL",
                    first_time=False,
                )

                # User should enter password to login
                return Response(
                    {
                        "is_password_autoset": user.is_password_autoset,
                        "is_existing": True,
                    },
                    status=status.HTTP_200_OK,
                )
