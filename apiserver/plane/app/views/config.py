# Python imports
import os

# Django imports
from django.conf import settings

# Third party imports
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.license.utils.instance_value import get_configuration_value


class ConfigurationEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request):
        # Get all the configuration
        (
            GOOGLE_CLIENT_ID,
            GITHUB_CLIENT_ID,
            GITHUB_APP_NAME,
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
                    "default": os.environ.get("GOOGLE_CLIENT_ID", None),
                },
                {
                    "key": "GITHUB_CLIENT_ID",
                    "default": os.environ.get("GITHUB_CLIENT_ID", None),
                },
                {
                    "key": "GITHUB_APP_NAME",
                    "default": os.environ.get("GITHUB_APP_NAME", None),
                },
                {
                    "key": "EMAIL_HOST_USER",
                    "default": os.environ.get("EMAIL_HOST_USER", None),
                },
                {
                    "key": "EMAIL_HOST_PASSWORD",
                    "default": os.environ.get("EMAIL_HOST_PASSWORD", None),
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
                    "default": os.environ.get("SLACK_CLIENT_ID", "1"),
                },
                {
                    "key": "POSTHOG_API_KEY",
                    "default": os.environ.get("POSTHOG_API_KEY", "1"),
                },
                {
                    "key": "POSTHOG_HOST",
                    "default": os.environ.get("POSTHOG_HOST", "1"),
                },
                {
                    "key": "UNSPLASH_ACCESS_KEY",
                    "default": os.environ.get("UNSPLASH_ACCESS_KEY", "1"),
                },
                {
                    "key": "OPENAI_API_KEY",
                    "default": os.environ.get("OPENAI_API_KEY", "1"),
                },
            ]
        )

        data = {}
        # Authentication
        data["google_client_id"] = (
            GOOGLE_CLIENT_ID
            if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID != '""'
            else None
        )
        data["github_client_id"] = (
            GITHUB_CLIENT_ID
            if GITHUB_CLIENT_ID and GITHUB_CLIENT_ID != '""'
            else None
        )
        data["github_app_name"] = GITHUB_APP_NAME
        data["magic_login"] = (
            bool(EMAIL_HOST_USER) and bool(EMAIL_HOST_PASSWORD)
        ) and ENABLE_MAGIC_LINK_LOGIN == "1"

        data["email_password_login"] = ENABLE_EMAIL_PASSWORD == "1"
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
        data["is_smtp_configured"] = bool(EMAIL_HOST_USER) and bool(
            EMAIL_HOST_PASSWORD
        )

        return Response(data, status=status.HTTP_200_OK)


class MobileConfigurationEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request):
        (
            GOOGLE_CLIENT_ID,
            GOOGLE_SERVER_CLIENT_ID,
            GOOGLE_IOS_CLIENT_ID,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            ENABLE_MAGIC_LINK_LOGIN,
            ENABLE_EMAIL_PASSWORD,
            POSTHOG_API_KEY,
            POSTHOG_HOST,
            UNSPLASH_ACCESS_KEY,
            OPENAI_API_KEY,
        ) = get_configuration_value(
            [
                {
                    "key": "GOOGLE_CLIENT_ID",
                    "default": os.environ.get("GOOGLE_CLIENT_ID", None),
                },
                {
                    "key": "GOOGLE_SERVER_CLIENT_ID",
                    "default": os.environ.get("GOOGLE_SERVER_CLIENT_ID", None),
                },
                {
                    "key": "GOOGLE_IOS_CLIENT_ID",
                    "default": os.environ.get("GOOGLE_IOS_CLIENT_ID", None),
                },
                {
                    "key": "EMAIL_HOST_USER",
                    "default": os.environ.get("EMAIL_HOST_USER", None),
                },
                {
                    "key": "EMAIL_HOST_PASSWORD",
                    "default": os.environ.get("EMAIL_HOST_PASSWORD", None),
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
                    "key": "POSTHOG_API_KEY",
                    "default": os.environ.get("POSTHOG_API_KEY", "1"),
                },
                {
                    "key": "POSTHOG_HOST",
                    "default": os.environ.get("POSTHOG_HOST", "1"),
                },
                {
                    "key": "UNSPLASH_ACCESS_KEY",
                    "default": os.environ.get("UNSPLASH_ACCESS_KEY", "1"),
                },
                {
                    "key": "OPENAI_API_KEY",
                    "default": os.environ.get("OPENAI_API_KEY", "1"),
                },
            ]
        )
        data = {}
        # Authentication
        data["google_client_id"] = (
            GOOGLE_CLIENT_ID
            if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID != '""'
            else None
        )
        data["google_server_client_id"] = (
            GOOGLE_SERVER_CLIENT_ID
            if GOOGLE_SERVER_CLIENT_ID and GOOGLE_SERVER_CLIENT_ID != '""'
            else None
        )
        data["google_ios_client_id"] = (
            (GOOGLE_IOS_CLIENT_ID)[::-1]
            if GOOGLE_IOS_CLIENT_ID is not None
            else None
        )
        # Posthog
        data["posthog_api_key"] = POSTHOG_API_KEY
        data["posthog_host"] = POSTHOG_HOST

        data["magic_login"] = (
            bool(EMAIL_HOST_USER) and bool(EMAIL_HOST_PASSWORD)
        ) and ENABLE_MAGIC_LINK_LOGIN == "1"

        data["email_password_login"] = ENABLE_EMAIL_PASSWORD == "1"

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
        data["is_smtp_configured"] = not (
            bool(EMAIL_HOST_USER) and bool(EMAIL_HOST_PASSWORD)
        )

        return Response(data, status=status.HTTP_200_OK)
