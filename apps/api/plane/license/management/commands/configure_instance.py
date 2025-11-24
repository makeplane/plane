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

        keys = ["IS_GOOGLE_ENABLED", "IS_GITHUB_ENABLED", "IS_GITLAB_ENABLED", "IS_GITEA_ENABLED"]
        if not InstanceConfiguration.objects.filter(key__in=keys).exists():
            for key in keys:
                if key == "IS_GOOGLE_ENABLED":
                    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET = get_configuration_value(
                        [
                            {
                                "key": "GOOGLE_CLIENT_ID",
                                "default": os.environ.get("GOOGLE_CLIENT_ID", ""),
                            },
                            {
                                "key": "GOOGLE_CLIENT_SECRET",
                                "default": os.environ.get("GOOGLE_CLIENT_SECRET", "0"),
                            },
                        ]
                    )
                    if bool(GOOGLE_CLIENT_ID) and bool(GOOGLE_CLIENT_SECRET):
                        value = "1"
                    else:
                        value = "0"
                    InstanceConfiguration.objects.create(
                        key=key,
                        value=value,
                        category="AUTHENTICATION",
                        is_encrypted=False,
                    )
                    self.stdout.write(self.style.SUCCESS(f"{key} loaded with value from environment variable."))
                if key == "IS_GITHUB_ENABLED":
                    GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET = get_configuration_value(
                        [
                            {
                                "key": "GITHUB_CLIENT_ID",
                                "default": os.environ.get("GITHUB_CLIENT_ID", ""),
                            },
                            {
                                "key": "GITHUB_CLIENT_SECRET",
                                "default": os.environ.get("GITHUB_CLIENT_SECRET", "0"),
                            },
                        ]
                    )
                    if bool(GITHUB_CLIENT_ID) and bool(GITHUB_CLIENT_SECRET):
                        value = "1"
                    else:
                        value = "0"
                    InstanceConfiguration.objects.create(
                        key="IS_GITHUB_ENABLED",
                        value=value,
                        category="AUTHENTICATION",
                        is_encrypted=False,
                    )
                    self.stdout.write(self.style.SUCCESS(f"{key} loaded with value from environment variable."))
                if key == "IS_GITLAB_ENABLED":
                    GITLAB_HOST, GITLAB_CLIENT_ID, GITLAB_CLIENT_SECRET = get_configuration_value(
                        [
                            {
                                "key": "GITLAB_HOST",
                                "default": os.environ.get("GITLAB_HOST", "https://gitlab.com"),
                            },
                            {
                                "key": "GITLAB_CLIENT_ID",
                                "default": os.environ.get("GITLAB_CLIENT_ID", ""),
                            },
                            {
                                "key": "GITLAB_CLIENT_SECRET",
                                "default": os.environ.get("GITLAB_CLIENT_SECRET", ""),
                            },
                        ]
                    )
                    if bool(GITLAB_HOST) and bool(GITLAB_CLIENT_ID) and bool(GITLAB_CLIENT_SECRET):
                        value = "1"
                    else:
                        value = "0"
                    InstanceConfiguration.objects.create(
                        key="IS_GITLAB_ENABLED",
                        value=value,
                        category="AUTHENTICATION",
                        is_encrypted=False,
                    )
                    self.stdout.write(self.style.SUCCESS(f"{key} loaded with value from environment variable."))
                if key == "IS_GITEA_ENABLED":
                    GITEA_HOST, GITEA_CLIENT_ID, GITEA_CLIENT_SECRET = get_configuration_value(
                        [
                            {
                                "key": "GITEA_HOST",
                                "default": os.environ.get("GITEA_HOST", ""),
                            },
                            {
                                "key": "GITEA_CLIENT_ID",
                                "default": os.environ.get("GITEA_CLIENT_ID", ""),
                            },
                            {
                                "key": "GITEA_CLIENT_SECRET",
                                "default": os.environ.get("GITEA_CLIENT_SECRET", ""),
                            },
                        ]
                    )
                    if bool(GITEA_HOST) and bool(GITEA_CLIENT_ID) and bool(GITEA_CLIENT_SECRET):
                        value = "1"
                    else:
                        value = "0"
                    InstanceConfiguration.objects.create(
                        key="IS_GITEA_ENABLED",
                        value=value,
                        category="AUTHENTICATION",
                        is_encrypted=False,
                    )
                    self.stdout.write(self.style.SUCCESS(f"{key} loaded with value from environment variable."))
        else:
            for key in keys:
                self.stdout.write(self.style.WARNING(f"{key} configuration already exists"))
