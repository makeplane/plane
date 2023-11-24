# Python imports
import os

# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

# Module imports
from plane.license.models import InstanceConfiguration

class Command(BaseCommand):
    help = "Configure instance variables"

    def handle(self, *args, **options):
        config_keys = {
            # Authentication Settings
            "GOOGLE_CLIENT_ID": os.environ.get("GOOGLE_CLIENT_ID"),
            "GOOGLE_CLIENT_SECRET": os.environ.get("GOOGLE_CLIENT_SECRET"),
            "GITHUB_CLIENT_ID": os.environ.get("GITHUB_CLIENT_ID"),
            "GITHUB_CLIENT_SECRET": os.environ.get("GITHUB_CLIENT_SECRET"),
            "ENABLE_SIGNUP": os.environ.get("ENABLE_SIGNUP", "1"),
            "ENABLE_EMAIL_PASSWORD": os.environ.get("ENABLE_EMAIL_PASSWORD", "1"),
            "ENABLE_MAGIC_LINK_LOGIN": os.environ.get("ENABLE_MAGIC_LINK_LOGIN", "0"),
            # Email Settings
            "EMAIL_HOST": os.environ.get("EMAIL_HOST", ""),
            "EMAIL_HOST_USER": os.environ.get("EMAIL_HOST_USER", ""),
            "EMAIL_HOST_PASSWORD": os.environ.get("EMAIL_HOST_PASSWORD"),
            "EMAIL_PORT": os.environ.get("EMAIL_PORT", "587"),
            "EMAIL_FROM": os.environ.get("EMAIL_FROM", ""),
            "EMAIL_USE_TLS": os.environ.get("EMAIL_USE_TLS", "1"),
            "EMAIL_USE_SSL": os.environ.get("EMAIL_USE_SSL", "0"),
            # Open AI Settings
            "OPENAI_API_BASE": os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1"),
            "OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY", ""),
            "GPT_ENGINE": os.environ.get("GPT_ENGINE", "gpt-3.5-turbo"),
            # Unsplash Access Key
            "UNSPLASH_ACCESS_KEY": os.environ.get("UNSPLASH_ACESS_KEY", "")
        }

        for key, value in config_keys.items():
            obj, created = InstanceConfiguration.objects.get_or_create(
                key=key
            )
            if created:
                obj.value = value
                obj.save()
                self.stdout.write(self.style.SUCCESS(f"{key} loaded with value from environment variable."))
            else:
                self.stdout.write(self.style.WARNING(f"{key} configuration already exists"))