# Python imports
import json
import os
import requests
import uuid

# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import validate_email

# Module imports
from plane.db.models import User
from plane.license.models import Instance, InstanceAdmin


class Command(BaseCommand):
    help = "Check if instance in registered else register"

    def handle(self, *args, **options):
        # Check if the instance is registered
        instance = Instance.objects.first()

        # If instance is None then register this instance
        if instance is None:
            with open("package.json", "r") as file:
                # Load JSON content from the file
                data = json.load(file)

            admin_email = os.environ.get("ADMIN_EMAIL")

            try:
                validate_email(admin_email)
            except ValidationError:
                CommandError(f"{admin_email} is not a valid ADMIN_EMAIL")

            # Raise an exception if the admin email is not provided
            if not admin_email:
                raise CommandError("ADMIN_EMAIL is required")

            # Check if the admin email user exists
            user = User.objects.filter(email=admin_email).first()

            # If the user does not exist create the user and add him to the database
            if user is None:
                user = User.objects.create(email=admin_email, username=uuid.uuid4().hex)
                user.set_password(uuid.uuid4().hex)
                user.save()

            license_engine_base_url = os.environ.get("LICENSE_ENGINE_BASE_URL")

            if not license_engine_base_url:
                raise CommandError("LICENSE_ENGINE_BASE_URL is required")

            headers = {"Content-Type": "application/json"}

            payload = {
                "email": user.email,
                "version": data.get("version", 0.1),
            }

            response = requests.post(
                f"{license_engine_base_url}/api/instances/",
                headers=headers,
                data=json.dumps(payload),
            )

            if response.status_code == 201:
                data = response.json()
                # Create instance
                instance = Instance.objects.create(
                    instance_name="Plane Free",
                    instance_id=data.get("id"),
                    license_key=data.get("license_key"),
                    api_key=data.get("api_key"),
                    version=data.get("version"),
                    primary_email=data.get("email"),
                    primary_owner=user,
                    last_checked_at=timezone.now(),
                )
                # Create instance admin
                _ = InstanceAdmin.objects.create(
                    user=user,
                    instance=instance,
                    role=20,
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Instance succesfully registered with owner: {instance.primary_owner.email}"
                    )
                )
                return

            self.stdout.write(self.style.WARNING("Instance could not be registered"))
            return
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Instance already registered with instance owner: {instance.primary_owner.email}"
                )
            )
            return
