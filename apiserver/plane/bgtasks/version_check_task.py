# Python imports
import os
import requests

# Django imports
from django.utils import timezone

# Third Party Imports
from celery import shared_task

# Module imports
from plane.license.models import Instance
from plane.utils.exception_logger import log_exception


@shared_task
def version_check():
    try:
        # Get the environment variables
        license_version = os.environ.get("LICENSE_VERSION", False)
        prime_host = os.environ.get("PRIME_HOST", False)
        license_key = os.environ.get("LICENSE_KEY", False)
        machine_signature = os.environ.get("MACHINE_SIGNATURE", False)

        # Check if the instance is registered
        instance = Instance.objects.first()

        # If license version is not provided then read from package.json

        if license_version and license_key and prime_host:
            response = requests.get(
                f"{prime_host}/api/instance/me/",
                headers={
                    "Content-Type": "application/json",
                    "X-Machine-Signature": str(machine_signature),
                    "X-Api-Key": str(license_key),
                },
            )

            # Raise an exception if the status code is not 200
            response.raise_for_status()

            # Get the data from the response
            data = response.json()

            instance.last_checked_at = timezone.now()
            instance.current_version = data.get(
                "user_version", instance.current_version
            )
            instance.latest_version = data.get(
                "latest_version", instance.latest_version
            )
            instance.save()

            return
    except requests.RequestException as e:
        log_exception(e)
        return
    except Exception as e:
        log_exception(e)
        return
