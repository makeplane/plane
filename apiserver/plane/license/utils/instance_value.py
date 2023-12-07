# Python imports
import os

# Django imports
from django.conf import settings

# Module imports
from plane.license.models import InstanceConfiguration
from plane.license.utils.encryption import decrypt_data


# Helper function to return value from the passed key
def get_configuration_value(keys):
    environment_list = []
    if settings.SKIP_ENV_VAR:
        # Get the configurations
        instance_configuration = InstanceConfiguration.objects.values(
            "key", "value", "is_encrypted"
        )

        for key in keys:
            for item in instance_configuration:
                if key.get("key") == item.get("key"):
                    if item.get("is_encrypted", False):
                        environment_list.append(decrypt_data(item.get("value")))
                    else:
                        environment_list.append(item.get("value"))

                    break
            else:
                environment_list.append(key.get("default"))

    return tuple(environment_list)


def get_email_configuration():
    if settings.SKIP_ENV_VAR:
        (
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_HOST,
            EMAIL_FROM,
            EMAIL_USE_TLS,
            EMAIL_PORT,
        ) = get_configuration_value(
            [
                {
                    "key": "EMAIL_HOST_USER",
                    "default": os.environ.get("EMAIL_HOST_USER", None),
                },
                {
                    "key": "EMAIL_HOST_PASSWORD",
                    "default": os.environ.get("EMAIL_HOST_PASSWORD", None),
                },
                {
                    "key": "EMAIL_HOST",
                    "default": os.environ.get("EMAIL_HOST", None),
                },
                {
                    "key": "EMAIL_FROM",
                    "default": os.environ.get("EMAIL_FROM", None),
                },
                {
                    "key": "EMAIL_USE_TLS",
                    "default": os.environ.get("EMAIL_USE_TLS", "1"),
                },
                {
                    "key": "EMAIL_PORT",
                    "default": os.environ.get("EMAIL_PORT", 587),
                },
            ]
        )
        return (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_FROM,
        )

    else:
        # Get email configuration directly from os
        EMAIL_HOST = os.environ.get("EMAIL_HOST")
        EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
        EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
        EMAIL_PORT = os.environ.get("EMAIL_PORT", 587)
        EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "1")
        EMAIL_FROM = os.environ.get("EMAIL_FROM", "Team Plane <team@mailer.plane.so>")

        return (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_FROM,
        )
