# Python imports
import json
import requests
import os

# django imports
from django.conf import settings

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import User
from plane.license.models import Instance

@shared_task
def update_user_instance_user_count():
    try:
        instance_users = User.objects.filter(is_bot=False).count()
        instance = Instance.objects.update(user_count=instance_users)

        # Update the count in the license engine
        payload = {
            "user_count": User.objects.count(),
        }

        # Save the user in control center
        headers = {
            "Content-Type": "application/json",
            "x-instance-id": instance.instance_id,
            "x-api-key": instance.api_key,
        }

        # Update the license engine
        _ = requests.post(
            f"{settings.LICENSE_ENGINE_BASE_URL}/api/instances/",
            headers=headers,
            data=json.dumps(payload),
        )

    except Exception as e:
        if settings.DEBUG:
            print(e)
        capture_exception(e)
