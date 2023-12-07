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
    else:
        # Get the configuration from os
        for key in keys:
            environment_list.append(os.environ.get(key.get("key"), key.get("default")))

    return tuple(environment_list)


def get_email_configuration():
    return (
        get_configuration_value(
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
                    "default": os.environ.get("EMAIL_FROM", "Team Plane <team@mailer.plane.so>"),
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
    )

