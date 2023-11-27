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
from plane.license.models import Instance, InstanceConfiguration
from plane.license.utils.instance_value import get_configuration_value


class ConfigurationEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request):
        instance_configuration = InstanceConfiguration.objects.values("key", "value")

        data = {}
        # Authentication
        data["google_client_id"] = get_configuration_value(
            instance_configuration,
            "GOOGLE_CLIENT_ID",
            os.environ.get("GOOGLE_CLIENT_ID", None),
        )
        data["github_client_id"] = get_configuration_value(
            instance_configuration,
            "GITHUB_CLIENT_ID",
            os.environ.get("GITHUB_CLIENT_ID", None),
        )
        data["github_app_name"] = get_configuration_value(
            instance_configuration,
            "GITHUB_APP_NAME",
            os.environ.get("GITHUB_APP_NAME", None),
        )
        data["magic_login"] = (
            bool(
                get_configuration_value(
                    instance_configuration,
                    "EMAIL_HOST_USER",
                    os.environ.get("EMAIL_HOST_USER", None),
                ),
            )
            and bool(
                get_configuration_value(
                    instance_configuration,
                    "EMAIL_HOST_PASSWORD",
                    os.environ.get("EMAIL_HOST_PASSWORD", None),
                )
            )
        ) and get_configuration_value(
            instance_configuration, "ENABLE_MAGIC_LINK_LOGIN", "1"
        ) == "1"

        data["email_password_login"] = (
            get_configuration_value(
                instance_configuration, "ENABLE_EMAIL_PASSWORD", "1"
            )
            == "1"
        )
        # Slack client
        data["slack_client_id"] = get_configuration_value(
            instance_configuration,
            "SLACK_CLIENT_ID",
            os.environ.get("SLACK_CLIENT_ID", None),
        )

        # Posthog
        data["posthog_api_key"] = get_configuration_value(
            instance_configuration,
            "POSTHOG_API_KEY",
            os.environ.get("POSTHOG_API_KEY", None),
        )
        data["posthog_host"] = get_configuration_value(
            instance_configuration,
            "POSTHOG_HOST",
            os.environ.get("POSTHOG_HOST", None),
        )

        # Unsplash
        data["has_unsplash_configured"] = bool(
            get_configuration_value(
                instance_configuration,
                "UNSPLASH_ACCESS_KEY",
                os.environ.get("UNSPLASH_ACCESS_KEY", None),
            )
        )

        # Open AI settings
        data["has_openai_configured"] = bool(
            get_configuration_value(
                instance_configuration,
                "OPENAI_API_KEY",
                os.environ.get("OPENAI_API_KEY", None),
            )
        )

        data["file_size_limit"] = float(os.environ.get("FILE_SIZE_LIMIT", 5242880))

        return Response(data, status=status.HTTP_200_OK)
