import os, sys


sys.path.append("/code")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")

import django

django.setup()


def load_config():
    from plane.license.models import InstanceConfiguration

    config_keys = {
        # Authentication Settings
        "GOOGLE_CLIENT_ID": os.environ.get("GOOGLE_CLIENT_ID"),
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
        "OPENAI_API_BASE": os.environ.get("", "https://api.openai.com/v1"),
        "OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY", "sk-"),
        "GPT_ENGINE": os.environ.get("GPT_ENGINE", "gpt-3.5-turbo"),
    }

    for key, value in config_keys.items():
        obj, created = InstanceConfiguration.objects.update_or_create(
            key=key, value=value
        )
        action = "Created" if created else "Updated"
        print(f"{action} {key} with value from environment variable.")


if __name__ == "__main__":
    load_config()
