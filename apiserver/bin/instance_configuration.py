import os, sys


sys.path.append("/code")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")

import django

django.setup()

def load_config():
        from plane.license.models import InstanceConfiguration
        # List of config keys to load from env
        config_keys = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_STORAGE_BUCKET_NAME', 'AWS_S3_ENDPOINT_URL', 'AWS_REGION_NAME'] 

        for key in config_keys:
            value = os.getenv(key)
            if value is not None:
                obj, created = InstanceConfiguration.objects.update_or_create(
                    key=key,
                    value=value
                )
                action = 'Created' if created else 'Updated'
                sys.stdout.write(sys.stdout.style.SUCCESS(f'{action} {key} with value from environment variable.'))
            else:
                sys.stdout.write(sys.stdout.style.WARNING(f'Environment variable {key} not set.'))


if __name__ == "__main__":
    load_config()