# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os

# Django imports
from django.core.management.base import BaseCommand, CommandError

# Module imports
from plane.license.models import InstanceConfiguration
from plane.utils.instance_config_variables import instance_config_variables


class Command(BaseCommand):
    help = "Configure instance variables"

    def handle(self, *args, **options):
        from plane.license.utils.encryption import encrypt_data
        from plane.license.utils.instance_value import get_configuration_value

        mandatory_keys = ["SECRET_KEY"]

        for item in mandatory_keys:
            if not os.environ.get(item):
                raise CommandError(f"{item} env variable is required.")

        for item in instance_config_variables:
            obj, created = InstanceConfiguration.objects.get_or_create(key=item.get("key"))
            if created:
                obj.category = item.get("category")
                obj.is_encrypted = item.get("is_encrypted", False)
                if item.get("is_encrypted", False):
                    obj.value = encrypt_data(item.get("value"))
                else:
                    obj.value = item.get("value")
                obj.save()
                self.stdout.write(self.style.SUCCESS(f"{obj.key} loaded with value from environment variable."))
            else:
                self.stdout.write(self.style.WARNING(f"{obj.key} configuration already exists"))

        # Seed IS_*_ENABLED flags individually using get_or_create so that
        # each missing key is created independently of the others.
        oauth_enabled_keys = {
            "IS_GOOGLE_ENABLED": lambda: all(
                get_configuration_value(
                    [
                        {"key": "GOOGLE_CLIENT_ID", "default": os.environ.get("GOOGLE_CLIENT_ID", "")},
                        {"key": "GOOGLE_CLIENT_SECRET", "default": os.environ.get("GOOGLE_CLIENT_SECRET", "")},
                    ]
                )
            ),
            "IS_GITHUB_ENABLED": lambda: all(
                get_configuration_value(
                    [
                        {"key": "GITHUB_CLIENT_ID", "default": os.environ.get("GITHUB_CLIENT_ID", "")},
                        {"key": "GITHUB_CLIENT_SECRET", "default": os.environ.get("GITHUB_CLIENT_SECRET", "")},
                    ]
                )
            ),
            "IS_GITLAB_ENABLED": lambda: all(
                get_configuration_value(
                    [
                        {"key": "GITLAB_HOST", "default": os.environ.get("GITLAB_HOST", "")},
                        {"key": "GITLAB_CLIENT_ID", "default": os.environ.get("GITLAB_CLIENT_ID", "")},
                        {"key": "GITLAB_CLIENT_SECRET", "default": os.environ.get("GITLAB_CLIENT_SECRET", "")},
                    ]
                )
            ),
            "IS_GITEA_ENABLED": lambda: all(
                get_configuration_value(
                    [
                        {"key": "GITEA_HOST", "default": os.environ.get("GITEA_HOST", "")},
                        {"key": "GITEA_CLIENT_ID", "default": os.environ.get("GITEA_CLIENT_ID", "")},
                        {"key": "GITEA_CLIENT_SECRET", "default": os.environ.get("GITEA_CLIENT_SECRET", "")},
                    ]
                )
            ),
        }

        for key, check_configured in oauth_enabled_keys.items():
            obj, created = InstanceConfiguration.objects.get_or_create(
                key=key,
                defaults={
                    "value": "1" if check_configured() else "0",
                    "category": "AUTHENTICATION",
                    "is_encrypted": False,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"{key} loaded with value from environment variable."))
            else:
                self.stdout.write(self.style.WARNING(f"{key} configuration already exists"))
