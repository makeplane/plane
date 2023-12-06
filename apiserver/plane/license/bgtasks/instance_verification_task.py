# Python imports
import os
import json
import requests

# Django imports
from django.conf import settings

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import User
from plane.license.models import Instance, InstanceAdmin


def instance_verification(instance):
    with open("package.json", "r") as file:
        # Load JSON content from the file
        data = json.load(file)

    headers = {"Content-Type": "application/json"}
    payload = {
        "instance_key": settings.INSTANCE_KEY,
        "version": data.get("version", 0.1),
        "machine_signature": os.environ.get("MACHINE_SIGNATURE", "machine-signature"),
        "user_count": User.objects.filter(is_bot=False).count(),
    }
    # Register the instance
    response = requests.post(
        f"{settings.LICENSE_ENGINE_BASE_URL}/api/instances/",
        headers=headers,
        data=json.dumps(payload),
        timeout=30,
    )

    # check response status
    if response.status_code == 201:
        data = response.json()
        # Update instance
        instance.instance_id = data.get("id")
        instance.license_key = data.get("license_key")
        instance.api_key = data.get("api_key")
        instance.version = data.get("version")
        instance.user_count = data.get("user_count", 0)
        instance.is_verified = True
        instance.save()
    else:
        return


def admin_verification(instance):
    # Save the user in control center
    headers = {
        "Content-Type": "application/json",
        "x-instance-id": instance.instance_id,
        "x-api-key": instance.api_key,
    }

    # Get all the unverified instance admins
    instance_admins = InstanceAdmin.objects.filter(is_verified=False).select_related(
        "user"
    )
    updated_instance_admin = []

    # Verify the instance admin
    for instance_admin in instance_admins:
        instance_admin.is_verified = True
        # Create the admin
        response = requests.post(
            f"{settings.LICENSE_ENGINE_BASE_URL}/api/instances/users/register/",
            headers=headers,
            data=json.dumps(
                {
                    "email": str(instance_admin.user.email),
                    "signup_mode": "EMAIL",
                    "is_admin": True,
                }
            ),
            timeout=30,
        )
        updated_instance_admin.append(instance_admin)

    # update all the instance admins
    InstanceAdmin.objects.bulk_update(
        updated_instance_admin, ["is_verified"], batch_size=10
    )
    return

def instance_user_count(instance):
    try:
        instance_users = User.objects.filter(is_bot=False).count()

        # Update the count in the license engine
        payload = {
            "user_count": instance_users,
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
            timeout=30,
        )
        return
    except requests.RequestException:
        return


@shared_task
def instance_verification_task():
    try:
        # Get the first instance
        instance = Instance.objects.first()

        # Only register instance if it is not verified
        if not instance.is_verified:
            instance_verification(instance=instance)

        # Admin verifications
        admin_verification(instance=instance)

        # Update user count
        instance_user_count(instance=instance)

        return
    except requests.RequestException:
        return
