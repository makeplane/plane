# Python imports
import os

# Django imports
from django.conf import settings

# Third party imports
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from .base import BaseAPIView


class ConfigurationEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request):
        data = {}
        data["google"] = os.environ.get("GOOGLE_CLIENT_ID", None)
        data["github"] = os.environ.get("GITHUB_CLIENT_ID", None)
        data["github_app_name"] = os.environ.get("GITHUB_APP_NAME", None)
        data["magic_login"] = (
            bool(settings.EMAIL_HOST_USER) and bool(settings.EMAIL_HOST_PASSWORD)
        ) and os.environ.get("ENABLE_MAGIC_LINK_LOGIN", "0") == "1"
        data["email_password_login"] = (
            os.environ.get("ENABLE_EMAIL_PASSWORD", "0") == "1"
        )
        data["mobile_google_client_id"] = os.environ.get("MOBILE_GOOGLE_CLIENT_ID", None)
        data["mobile_google_server_client_id"] = os.environ.get("MOBILE_GOOGLE_SERVER_CLIENT_ID", None)
        data["mobile_google_ios_client_id"] = os.environ.get("MOBILE_GOOGLE_IOS_CLIENT_ID", None)
        data["mobile_reversed_google_ios_client_id"] = os.environ.get("MOBILE_REVERSED_GOOGLE_IOS_CLIENT_ID", None)
        data["mobile_unsplash_api"] = os.environ.get("MOBILE_UNSPLASH_API", None)
        data["mobile_sentry_dsn"] = os.environ.get("MOBILE_SENTRY_DSN", None)
        data["mobile_posthog_api"] = os.environ.get("MOBILE_POSTHOG_API", None)
        data["mobile_enable_track_events"] = os.environ.get("MOBILE_ENABLE_TRACK_EVENTS", "0") == "1"
        data["mobile_web_url"] = os.environ.get("MOBILE_WEB_URL", None)
        data["mobile_enable_o_auth"] = os.environ.get("MOBILE_ENABLE_O_AUTH", "0") == "1"
        return Response(data, status=status.HTTP_200_OK)
