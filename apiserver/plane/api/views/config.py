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
from plane.license.models import Instance
from plane.license.utils.instance_value  import get_configuration_value

class ConfigurationEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request):
        instance_configuration = Instance.objects.values("key", "value")

        data = {}
        # Authentication
        data["google_client_id"] = get_configuration_value(instance_configuration, "GOOGLE_CLIENT_ID")
        data["github_client_id"] = get_configuration_value(instance_configuration,"GITHUB_CLIENT_ID")
        data["github_app_name"] = get_configuration_value(instance_configuration, "GITHUB_APP_NAME")
        data["magic_login"] = (
            bool(get_configuration_value(instance_configuration, "EMAIL_HOST_USER")) and bool(get_configuration_value(instance_configuration, "EMAIL_HOST_PASSWORD"))
        ) and get_configuration_value(instance_configuration, "ENABLE_MAGIC_LINK_LOGIN", "0") == "1"
        data["email_password_login"] = (
            get_configuration_value(instance_configuration, "ENABLE_EMAIL_PASSWORD", "0") == "1"
        )
        # Slack client
        data["slack_client_id"] = get_configuration_value(instance_configuration, "SLACK_CLIENT_ID")
        
        # Posthog
        data["posthog_api_key"] = get_configuration_value(instance_configuration, "POSTHOG_API_KEY")
        data["posthog_host"] = get_configuration_value(instance_configuration, "POSTHOG_HOST")

        # Unsplash
        data["has_unsplash_configured"] = bool(get_configuration_value(instance_configuration, "UNSPLASH_ACCESS_KEY"))

        return Response(data, status=status.HTTP_200_OK)
