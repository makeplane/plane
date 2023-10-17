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
        return Response(data, status=status.HTTP_200_OK)
