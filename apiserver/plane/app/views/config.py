# Python imports
import os

from rest_framework import status

# Django imports
# Third party imports
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from plane.license.utils.instance_value import get_configuration_value
from plane.utils.cache import cache_response

# Module imports
from .base import BaseAPIView


class ConfigurationEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    @cache_response(60 * 60 * 2, user=False)
    def get(self, request):
        # Get all the configuration
        (
            GOOGLE_CLIENT_ID,
            GITHUB_CLIENT_ID,
            GITHUB_APP_NAME,
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            ENABLE_MAGIC_LINK_LOGIN,
            ENABLE_EMAIL_PASSWORD,
            SLACK_CLIENT_ID,
            POSTHOG_API_KEY,
            POSTHOG_HOST,
            UNSPLASH_ACCESS_KEY,
            OPENAI_API_KEY,
        ) = get_configuration_value(
            [
                {
                    "key": "GOOGLE_CLIENT_ID",
                    "default": os.environ.get("GOOGLE_CLIENT_ID", ""),
                },
                {
                    "key": "GITHUB_CLIENT_ID",
                    "default": os.environ.get("GITHUB_CLIENT_ID", ""),
                },
                {
                    "key": "GITHUB_APP_NAME",
                    "default": os.environ.get("GITHUB_APP_NAME", ""),
                },
                {
                    "key": "EMAIL_HOST",
                    "default": os.environ.get("EMAIL_HOST", ""),
                },
                {
                    "key": "EMAIL_HOST_USER",
                    "default": os.environ.get("EMAIL_HOST_USER", ""),
                },
                {
                    "key": "EMAIL_HOST_PASSWORD",
                    "default": os.environ.get("EMAIL_HOST_PASSWORD", ""),
                },
                {
                    "key": "ENABLE_MAGIC_LINK_LOGIN",
                    "default": os.environ.get("ENABLE_MAGIC_LINK_LOGIN", "1"),
                },
                {
                    "key": "ENABLE_EMAIL_PASSWORD",
                    "default": os.environ.get("ENABLE_EMAIL_PASSWORD", "1"),
                },
                {
                    "key": "SLACK_CLIENT_ID",
                    "default": os.environ.get("SLACK_CLIENT_ID", None),
                },
                {
                    "key": "POSTHOG_API_KEY",
                    "default": os.environ.get("POSTHOG_API_KEY", None),
                },
                {
                    "key": "POSTHOG_HOST",
                    "default": os.environ.get("POSTHOG_HOST", None),
                },
                {
                    "key": "UNSPLASH_ACCESS_KEY",
                    "default": os.environ.get("UNSPLASH_ACCESS_KEY", ""),
                },
                {
                    "key": "OPENAI_API_KEY",
                    "default": os.environ.get("OPENAI_API_KEY", ""),
                },
            ]
        )

        data = {}
        # Authentication

        data["is_google_enabled"] = bool(
            (
                GOOGLE_CLIENT_ID
                if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID != '""'
                else None
            )
        )
        data["is_github_enabled"] = (
            GITHUB_CLIENT_ID
            if GITHUB_CLIENT_ID and GITHUB_CLIENT_ID != '""'
            else None
        )
        data["github_app_name"] = str(GITHUB_APP_NAME)

        # Slack client
        data["slack_client_id"] = SLACK_CLIENT_ID

        # Posthog
        data["posthog_api_key"] = POSTHOG_API_KEY
        data["posthog_host"] = POSTHOG_HOST

        # Unsplash
        data["has_unsplash_configured"] = bool(UNSPLASH_ACCESS_KEY)

        # Open AI settings
        data["has_openai_configured"] = bool(OPENAI_API_KEY)

        # File size settings
        data["file_size_limit"] = float(
            os.environ.get("FILE_SIZE_LIMIT", 5242880)
        )

        # is smtp configured
        data["is_smtp_configured"] = (
            bool(EMAIL_HOST)
            and bool(EMAIL_HOST_USER)
            and bool(EMAIL_HOST_PASSWORD)
        )

        return Response(data, status=status.HTTP_200_OK)
