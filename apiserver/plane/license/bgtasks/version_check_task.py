# Python imports
import os
import requests

# Django imports
from django.utils import timezone

# Third Party Imports
from celery import shared_task

# Module imports
from plane.license.models import Instance, ChangeLog
from plane.utils.exception_logger import log_exception


def get_instance_me(machine_signature, license_key, prime_host):
    response = requests.get(
        f"{prime_host}/api/v2/instances/me/",
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
    return data


def get_instance_release_notes(machine_signature, license_key, prime_host):
    response = requests.get(
        f"{prime_host}/api/instance/release-notes/",
        headers={
            "Content-Type": "application/json",
            "X-Machine-Signature": str(machine_signature),
            "X-Api-Key": str(license_key),
        },
    )
    response.raise_for_status()
    data = response.json()
    return data


def update_instance(instance, data):
    instance.last_checked_at = timezone.now()
    instance.current_version = data.get("user_version", instance.current_version)
    instance.latest_version = data.get("latest_version", instance.latest_version)
    instance.save()


def update_change_log(release_notes=[]):
    ChangeLog.objects.all().delete()
    ChangeLog.objects.bulk_create(
        [
            ChangeLog(
                title=note.get("title", ""),
                description=note.get("description", ""),
                tags=note.get("tags", []),
                version=note.get("version_detail", {}).get("name", ""),
                release_date=note.get("release_date", timezone.now()),
                is_release_candidate=note.get("version_detail", {}).get(
                    "is_pre_release", False
                ),
            )
            for note in release_notes
        ],
        ignore_conflicts=True,
    )


@shared_task
def version_check():
    try:
        # Get the environment variables
        prime_host = os.environ.get("PRIME_HOST", False)
        license_key = os.environ.get("LICENSE_KEY", False)
        machine_signature = os.environ.get("MACHINE_SIGNATURE", False)

        # Check if the instance is registered
        instance = Instance.objects.first()

        # If license version is not provided then read from package.json

        if prime_host and machine_signature:
            # Get the instance data
            data = get_instance_me(machine_signature, license_key, prime_host)
            # Update the instance data
            update_instance(instance, data)
            # Update the release notes
            release_notes = get_instance_release_notes(
                machine_signature, license_key, prime_host
            )
            # Update the change log
            update_change_log(release_notes)
            return
        return
    except requests.RequestException as e:
        log_exception(e)
        return
    except Exception as e:
        log_exception(e)
        return
