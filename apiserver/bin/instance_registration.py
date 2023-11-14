# Python imports
import os, sys
import json
import uuid
import requests

# Django imports
from django.utils import timezone


sys.path.append("/code")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")

import django

django.setup()


def instance_registration():
    try:
        # Module imports
        from plane.db.models import User
        from plane.license.models import Instance

        # Check if the instance is registered
        instance = Instance.objects.first()

        # If instance is None then register this instance
        if instance is None:
            with open("/code/package.json", "r") as file:
                # Load JSON content from the file
                data = json.load(file)

            admin_email = os.environ.get("ADMIN_EMAIL")
            # Raise an exception if the admin email is not provided
            if not admin_email:
                raise Exception("ADMIN_EMAIL is required")

            # Check if the admin email user exists
            user = User.objects.filter(email=admin_email).first()

            # If the user does not exist create the user and add him to the database
            if user is None:
                user = User.objects.create(email=admin_email, username=uuid.uuid4().hex)
                user.set_password(uuid.uuid4().hex)
                user.save()

            license_engine_base_url = os.environ.get("LICENSE_ENGINE_BASE_URL")

            if not license_engine_base_url:
                raise Exception("LICENSE_ENGINE_BASE_URL is required")

            headers = {"Content-Type": "application/json"}

            payload = {
                "email": user.email,
                "version": data.get("version", 0.1),
            }

            response = requests.post(
                f"{license_engine_base_url}/api/instances",
                headers=headers,
                data=json.dumps(payload),
            )

            if response.status_code == 201:
                data = response.json()
                instance = Instance.objects.create(
                    instance_name="Plane Free",
                    instance_id=data.get("id"),
                    license_key=data.get("license_key"),
                    api_key=data.get("api_key"),
                    version=0.1,
                    email=data.get("email"),
                    owner=user,
                    last_checked_at=timezone.now(),
                )
                print(f"Instance succesfully registered with owner: {instance.owner.email}")
                return
            print("Instance could not be registered")
            return
        else:
            print(
                f"Instance already registered with instance owner: {instance.owner.email}"
            )
            return
    except ImportError:
        raise ImportError


if __name__ == "__main__":
    instance_registration()
