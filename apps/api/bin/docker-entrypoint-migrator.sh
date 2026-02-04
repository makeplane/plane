#!/bin/bash
set -e

python manage.py wait_for_db $1

python manage.py migrate $1

# Register the instance (creates Instance record if not exists)
# Using inline Python to avoid Celery task queue issues
python -c "
import os
import sys
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plane.settings.production')
django.setup()

from plane.license.models import Instance, InstanceEdition
import secrets
from django.utils import timezone

if not Instance.objects.exists():
    Instance.objects.create(
        instance_name='Plane Community Edition',
        instance_id=secrets.token_hex(12),
        current_version=os.environ.get('APP_VERSION', 'v0.24.0'),
        latest_version=os.environ.get('APP_VERSION', 'v0.24.0'),
        last_checked_at=timezone.now(),
        is_test=False,
        edition=InstanceEdition.PLANE_COMMUNITY.value
    )
    print('Instance created successfully')
else:
    print('Instance already exists')
"

# Configure instance with default settings
python manage.py configure_instance $1

# Fix bug: IS_GOOGLE_ENABLED etc. are not created by configure_instance
# because IS_GITEA_ENABLED already exists (it's in core_config_variables)
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plane.settings.production')
django.setup()

from plane.license.models import InstanceConfiguration
from plane.license.utils.instance_value import get_configuration_value

auth_toggle_configs = [
    ('IS_GOOGLE_ENABLED', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
    ('IS_GITHUB_ENABLED', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'),
    ('IS_GITLAB_ENABLED', 'GITLAB_CLIENT_ID', 'GITLAB_CLIENT_SECRET'),
]

for toggle_key, client_id_key, client_secret_key in auth_toggle_configs:
    if not InstanceConfiguration.objects.filter(key=toggle_key).exists():
        # Check if credentials are configured
        client_id, client_secret = get_configuration_value([
            {'key': client_id_key, 'default': os.environ.get(client_id_key, '')},
            {'key': client_secret_key, 'default': os.environ.get(client_secret_key, '')},
        ])
        value = '1' if (client_id and client_secret) else '0'
        InstanceConfiguration.objects.create(
            key=toggle_key,
            value=value,
            category='AUTHENTICATION',
            is_encrypted=False,
        )
        print(f'{toggle_key} created with value: {value}')
    else:
        print(f'{toggle_key} already exists')
"

# Clear the instance cache after setup
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plane.settings.production')
django.setup()

from django.core.cache import cache
try:
    cache.clear()
    print('Cache cleared successfully')
except Exception as e:
    print(f'Cache clear failed: {e}')
"