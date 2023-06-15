# Python imports
import uuid
import random
import string
import json
import requests

# Django imports
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.conf import settings
from django.contrib.auth.hashers import make_password

# Third party imports
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from sentry_sdk import capture_exception, capture_message

# Module imports
from . import BaseAPIView
from plane.db.models import User
from plane.api.serializers import UserSerializer
from plane.settings.redis import redis_instance
from plane.bgtasks.magic_link_code_task import magic_link


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return (
        str(refresh.access_token),
        str(refresh),
    )


class SignUpEndpoint(BaseAPIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        try:
            if not settings.ENABLE_SIGNUP:
                return Response(
                    {
                        "error": "New account creation is disabled. Please contact your site administrator"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            email = request.data.get("email", False)
            password = request.data.get("password", False)

            ## Raise exception if any of the above are missing
            if not email or not password:
                return Response(
                    {"error": "Both email and password are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            email = email.strip().lower()

            try:
                validate_email(email)
            except ValidationError as e:
                return Response(
                    {"error": "Please provide a valid email address."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if the user already exists
            if User.objects.filter(email=email).exists():
                return Response(
                    {"error": "User already exist please sign in"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.create(email=email, username=uuid.uuid4().hex)
            user.set_password(password)

            # settings last actives for the user
            user.last_active = timezone.now()
            user.last_login_time = timezone.now()
            user.last_login_ip = request.META.get("REMOTE_ADDR")
            user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
            user.token_updated_at = timezone.now()
            user.save()

            serialized_user = UserSerializer(user).data

            access_token, refresh_token = get_tokens_for_user(user)

            data = {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": serialized_user,
            }

            # Send Analytics
            if settings.ANALYTICS_BASE_API:
                _ = requests.post(
                    settings.ANALYTICS_BASE_API,
                    headers={
                        "Content-Type": "application/json",
                        "X-Auth-Token": settings.ANALYTICS_SECRET_KEY,
                    },
                    json={
                        "event_id": uuid.uuid4().hex,
                        "event_data": {
                            "medium": "email",
                        },
                        "user": {"email": email, "id": str(user.id)},
                        "device_ctx": {
                            "ip": request.META.get("REMOTE_ADDR"),
                            "user_agent": request.META.get("HTTP_USER_AGENT"),
                        },
                        "event_type": "SIGN_UP",
                    },
                )

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class SignInEndpoint(BaseAPIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        try:
            email = request.data.get("email", False)
            password = request.data.get("password", False)

            ## Raise exception if any of the above are missing
            if not email or not password:
                return Response(
                    {"error": "Both email and password are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            email = email.strip().lower()

            try:
                validate_email(email)
            except ValidationError as e:
                return Response(
                    {"error": "Please provide a valid email address."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.filter(email=email).first()

            if user is None:
                return Response(
                    {
                        "error": "Sorry, we could not find a user with the provided credentials. Please try again."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Sign up Process
            if not user.check_password(password):
                return Response(
                    {
                        "error": "Sorry, we could not find a user with the provided credentials. Please try again."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not user.is_active:
                return Response(
                    {
                        "error": "Your account has been deactivated. Please contact your site administrator."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            serialized_user = UserSerializer(user).data

            # settings last active for the user
            user.last_active = timezone.now()
            user.last_login_time = timezone.now()
            user.last_login_ip = request.META.get("REMOTE_ADDR")
            user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
            user.token_updated_at = timezone.now()
            user.save()

            access_token, refresh_token = get_tokens_for_user(user)
            # Send Analytics
            if settings.ANALYTICS_BASE_API:
                _ = requests.post(
                    settings.ANALYTICS_BASE_API,
                    headers={
                        "Content-Type": "application/json",
                        "X-Auth-Token": settings.ANALYTICS_SECRET_KEY,
                    },
                    json={
                        "event_id": uuid.uuid4().hex,
                        "event_data": {
                            "medium": "email",
                        },
                        "user": {"email": email, "id": str(user.id)},
                        "device_ctx": {
                            "ip": request.META.get("REMOTE_ADDR"),
                            "user_agent": request.META.get("HTTP_USER_AGENT"),
                        },
                        "event_type": "SIGN_IN",
                    },
                )
            data = {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": serialized_user,
            }

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            capture_exception(e)
            return Response(
                {
                    "error": "Something went wrong. Please try again later or contact the support team."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class SignOutEndpoint(BaseAPIView):
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token", False)

            if not refresh_token:
                capture_message("No refresh token provided")
                return Response(
                    {
                        "error": "Something went wrong. Please try again later or contact the support team."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.get(pk=request.user.id)

            user.last_logout_time = timezone.now()
            user.last_logout_ip = request.META.get("REMOTE_ADDR")

            user.save()

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "success"}, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {
                    "error": "Something went wrong. Please try again later or contact the support team."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class MagicSignInGenerateEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        try:
            email = request.data.get("email", False)

            if not email:
                return Response(
                    {"error": "Please provide a valid email address"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            validate_email(email)

            ## Generate a random token
            token = (
                "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
                + "-"
                + "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
                + "-"
                + "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
            )

            ri = redis_instance()

            key = "magic_" + str(email)

            # Check if the key already exists in python
            if ri.exists(key):
                data = json.loads(ri.get(key))

                current_attempt = data["current_attempt"] + 1

                if data["current_attempt"] > 2:
                    return Response(
                        {"error": "Max attempts exhausted. Please try again later."},
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

            current_site = settings.WEB_URL
            magic_link.delay(email, key, token, current_site)

            return Response({"key": key}, status=status.HTTP_200_OK)
        except ValidationError:
            return Response(
                {"error": "Please provide a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MagicSignInEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        try:
            user_token = request.data.get("token", "").strip().lower()
            key = request.data.get("key", False)

            if not key or user_token == "":
                return Response(
                    {"error": "User token and key are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ri = redis_instance()

            if ri.exists(key):
                data = json.loads(ri.get(key))

                token = data["token"]
                email = data["email"]

                if str(token) == str(user_token):
                    if User.objects.filter(email=email).exists():
                        user = User.objects.get(email=email)
                        # Send event to Jitsu for tracking
                        if settings.ANALYTICS_BASE_API:
                            _ = requests.post(
                                settings.ANALYTICS_BASE_API,
                                headers={
                                    "Content-Type": "application/json",
                                    "X-Auth-Token": settings.ANALYTICS_SECRET_KEY,
                                },
                                json={
                                    "event_id": uuid.uuid4().hex,
                                    "event_data": {
                                        "medium": "code",
                                    },
                                    "user": {"email": email, "id": str(user.id)},
                                    "device_ctx": {
                                        "ip": request.META.get("REMOTE_ADDR"),
                                        "user_agent": request.META.get(
                                            "HTTP_USER_AGENT"
                                        ),
                                    },
                                    "event_type": "SIGN_IN",
                                },
                            )
                    else:
                        user = User.objects.create(
                            email=email,
                            username=uuid.uuid4().hex,
                            password=make_password(uuid.uuid4().hex),
                            is_password_autoset=True,
                        )
                        # Send event to Jitsu for tracking
                        if settings.ANALYTICS_BASE_API:
                            _ = requests.post(
                                settings.ANALYTICS_BASE_API,
                                headers={
                                    "Content-Type": "application/json",
                                    "X-Auth-Token": settings.ANALYTICS_SECRET_KEY,
                                },
                                json={
                                    "event_id": uuid.uuid4().hex,
                                    "event_data": {
                                        "medium": "code",
                                    },
                                    "user": {"email": email, "id": str(user.id)},
                                    "device_ctx": {
                                        "ip": request.META.get("REMOTE_ADDR"),
                                        "user_agent": request.META.get(
                                            "HTTP_USER_AGENT"
                                        ),
                                    },
                                    "event_type": "SIGN_UP",
                                },
                            )

                    user.last_active = timezone.now()
                    user.last_login_time = timezone.now()
                    user.last_login_ip = request.META.get("REMOTE_ADDR")
                    user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
                    user.token_updated_at = timezone.now()
                    user.save()
                    serialized_user = UserSerializer(user).data

                    access_token, refresh_token = get_tokens_for_user(user)
                    data = {
                        "access_token": access_token,
                        "refresh_token": refresh_token,
                        "user": serialized_user,
                    }

                    return Response(data, status=status.HTTP_200_OK)

                else:
                    return Response(
                        {"error": "Your login code was incorrect. Please try again."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            else:
                return Response(
                    {"error": "The magic code/link has expired please try again"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
