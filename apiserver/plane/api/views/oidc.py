# Python imports
from base64 import b64encode
import uuid
import requests
import os

# Django imports
from django.utils import timezone
from django.conf import settings

# Third Party modules
from rest_framework.response import Response
from rest_framework import exceptions
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import SocialLoginConnection, User
from plane.api.serializers import UserSerializer
from .base import BaseAPIView


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return (
        str(refresh.access_token),
        str(refresh),
    )


def get_access_token(request_token: str, client_id: str) -> str:
    """Obtain the request token from github.
    Given the client id, client secret and request issued out by GitHub, this method
    should give back an access token
    Parameters
    ----------
    CLIENT_ID: str
        A string representing the client id issued out by github
    CLIENT_SECRET: str
        A string representing the client secret issued out by github
    request_token: str
        A string representing the request token issued out by github
    Throws
    ------
    ValueError:
        if CLIENT_ID or CLIENT_SECRET or request_token is empty or not a string
    Returns
    -------
    access_token: str
        A string representing the access token issued out by github
    """

    if not request_token:
        raise ValueError("The request token has to be supplied!")

    ACCESS_TOKEN_URL = os.environ.get("OIDC_URL_TOKEN")
    CLIENT_SECRET = os.environ.get("OIDC_CLIENT_SECRET")
    WEB_URL = os.environ.get("WEB_URL")

    url = f"{ACCESS_TOKEN_URL}"
    data = {
        "grant_type": "authorization_code",
        "code": request_token,
        "redirect_uri": WEB_URL,
    }
    basic_auth = b64encode(f"{client_id}:{CLIENT_SECRET}".encode('utf-8')).decode("ascii")
    headers = {
        "accept": "application/json", 
        "content-type": "application/x-www-form-urlencoded", 
        "Authorization": "Basic " + basic_auth,
    }

    res = requests.post(url, headers=headers, data=data)

    data = res.json()
    access_token = data["access_token"]

    return access_token


def get_user_data(access_token: str) -> dict:
    """
    Obtain the user data from github.
    Given the access token, this method should give back the user data
    """
    if not access_token:
        raise ValueError("The request token has to be supplied!")
    if not isinstance(access_token, str):
        raise ValueError("The request token has to be a string!")

    USERINFO_URL = os.environ.get("OIDC_URL_USERINFO")

    access_token = "Bearer " + access_token
    headers = {"Authorization": access_token}

    response = requests.get(url=USERINFO_URL, headers=headers)

    user_data = response.json()

    return user_data


class OIDCEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            id_token = request.data.get("credential", False)
            client_id = request.data.get("clientId", False)

            if not id_token:
                return Response(
                    {
                        "error": "Something went wrong. Please try again later or contact the support team."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            access_token = get_access_token(id_token, client_id)
            data = get_user_data(access_token)

            email = data.get("email", None)
            if email == None:
                return Response(
                    {
                        "error": "Something went wrong. Please try again later or contact the support team."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if "@" in email:
                user = User.objects.get(email=email)
                email = data["email"]
                channel = "email"
                mobile_number = uuid.uuid4().hex
                email_verified = True
            else:
                return Response(
                    {
                        "error": "Something went wrong. Please try again later or contact the support team."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ## Login Case

            if not user.is_active:
                return Response(
                    {
                        "error": "Your account has been deactivated. Please contact your site administrator."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            user.last_active = timezone.now()
            user.last_login_time = timezone.now()
            user.last_login_ip = request.META.get("REMOTE_ADDR")
            user.last_login_medium = f"oidc"
            user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
            user.is_email_verified = email_verified
            user.save()

            serialized_user = UserSerializer(user).data

            access_token, refresh_token = get_tokens_for_user(user)

            data = {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": serialized_user,
            }

            SocialLoginConnection.objects.update_or_create(
                medium="oidc",
                extra_data={},
                user=user,
                defaults={
                    "token_data": {"id_token": id_token},
                    "last_login_at": timezone.now(),
                },
            )
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
                            "medium": f"oidc",
                        },
                        "user": {"email": email, "id": str(user.id)},
                        "device_ctx": {
                            "ip": request.META.get("REMOTE_ADDR"),
                            "user_agent": request.META.get("HTTP_USER_AGENT"),
                        },
                        "event_type": "SIGN_IN",
                    },
                )
            return Response(data, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            ## Signup Case

            username = data.get("preferred_username", uuid.uuid4().hex)
                
            if "@" in email:
                email = data["email"]
                mobile_number = uuid.uuid4().hex
                channel = "email"
                email_verified = True
            else:
                return Response(
                    {
                        "error": "Something went wrong. Please try again later or contact the support team."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User(
                username=username,
                email=email,
                mobile_number=mobile_number,
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", ""),
                is_email_verified=email_verified,
                is_password_autoset=True,
            )

            user.set_password(uuid.uuid4().hex)
            user.is_password_autoset = True
            user.last_active = timezone.now()
            user.last_login_time = timezone.now()
            user.last_login_ip = request.META.get("REMOTE_ADDR")
            user.last_login_medium = "oidc"
            user.last_login_uagent = request.META.get("HTTP_USER_AGENT")
            user.token_updated_at = timezone.now()
            user.save()
            serialized_user = UserSerializer(user).data

            access_token, refresh_token = get_tokens_for_user(user)
            data = {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": serialized_user,
                "permissions": [],
            }
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
                            "medium": f"oidc",
                        },
                        "user": {"email": email, "id": str(user.id)},
                        "device_ctx": {
                            "ip": request.META.get("REMOTE_ADDR"),
                            "user_agent": request.META.get("HTTP_USER_AGENT"),
                        },
                        "event_type": "SIGN_UP",
                    },
                )

            SocialLoginConnection.objects.update_or_create(
                medium="oidc",
                extra_data={},
                user=user,
                defaults={
                    "token_data": {"id_token": id_token},
                    "last_login_at": timezone.now(),
                },
            )
            return Response(data, status=status.HTTP_201_CREATED)
        except Exception as e:
            capture_exception(e)
            return Response(
                {
                    "error": "Something went wrong. Please try again later or contact the support team."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
