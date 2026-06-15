# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

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
        instance_configuration = InstanceConfiguration.objects.values("key", "value", "is_encrypted")

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
    return get_configuration_value(
        [
            {"key": "EMAIL_HOST", "default": os.environ.get("EMAIL_HOST")},
            {"key": "EMAIL_HOST_USER", "default": os.environ.get("EMAIL_HOST_USER")},
            {
                "key": "EMAIL_HOST_PASSWORD",
                "default": os.environ.get("EMAIL_HOST_PASSWORD"),
            },
            {"key": "EMAIL_PORT", "default": os.environ.get("EMAIL_PORT", 587)},
            {"key": "EMAIL_USE_TLS", "default": os.environ.get("EMAIL_USE_TLS", "1")},
            {"key": "EMAIL_USE_SSL", "default": os.environ.get("EMAIL_USE_SSL", "0")},
            {
                "key": "EMAIL_FROM",
                "default": os.environ.get("EMAIL_FROM", "Team Gizmo <team@mailer.gizmo.so>"),
            },
        ]
    )


def get_mail_configuration():
    return get_configuration_value(
        [
            {"key": "MAIL_IMAP_HOST", "default": os.environ.get("MAIL_IMAP_HOST", "dovecot")},
            {"key": "MAIL_IMAP_PORT", "default": os.environ.get("MAIL_IMAP_PORT", 993)},
            {"key": "MAIL_IMAP_USE_SSL", "default": os.environ.get("MAIL_IMAP_USE_SSL", "1")},
            {"key": "MAIL_IMAP_STARTTLS", "default": os.environ.get("MAIL_IMAP_STARTTLS", "0")},
            {"key": "MAIL_IMAP_VERIFY_SSL", "default": os.environ.get("MAIL_IMAP_VERIFY_SSL", "0")},
            {"key": "MAIL_IMAP_TIMEOUT", "default": os.environ.get("MAIL_IMAP_TIMEOUT", 15)},
            {"key": "MAIL_SMTP_HOST", "default": os.environ.get("MAIL_SMTP_HOST", "postfix")},
            {"key": "MAIL_SMTP_PORT", "default": os.environ.get("MAIL_SMTP_PORT", 587)},
            {"key": "MAIL_SMTP_USE_TLS", "default": os.environ.get("MAIL_SMTP_USE_TLS", "1")},
            {"key": "MAIL_SMTP_USE_SSL", "default": os.environ.get("MAIL_SMTP_USE_SSL", "0")},
            {"key": "MAIL_MASTER_USER", "default": os.environ.get("MAIL_MASTER_USER", "master")},
            {"key": "MAIL_MASTER_PASSWORD", "default": os.environ.get("MAIL_MASTER_PASSWORD", "")},
            {"key": "MAIL_MASTER_SEPARATOR", "default": os.environ.get("MAIL_MASTER_SEPARATOR", "*")},
            {
                "key": "MAIL_MAX_ATTACHMENT_BYTES",
                "default": os.environ.get("MAIL_MAX_ATTACHMENT_BYTES", 25 * 1024 * 1024),
            },
            {"key": "MAIL_SIEVE_HOST", "default": os.environ.get("MAIL_SIEVE_HOST", "dovecot")},
            {"key": "MAIL_SIEVE_PORT", "default": os.environ.get("MAIL_SIEVE_PORT", 4190)},
            {"key": "MAIL_SIEVE_STARTTLS", "default": os.environ.get("MAIL_SIEVE_STARTTLS", "1")},
        ]
    )
