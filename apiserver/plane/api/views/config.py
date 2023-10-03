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
        try:
            data = {}
            data["google"] = os.environ.get("GOOGLE_CLIENT_ID", None)
            data["github"] = os.environ.get("GITHUB_CLIENT_ID", None)
            data["github_app_name"] = os.environ.get("GITHUB_APP_NAME", None)
            data["magic_login"] = bool(settings.EMAIL_HOST_USER) and bool(settings.EMAIL_HOST_PASSWORD)
            data["email_password_login"] = os.environ.get("ENABLE_EMAIL_PASSWORD", "0") == "1" 
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
