# Python imports
import json
import secrets
import os
import requests

# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

# Module imports
from plane.license.models import Instance
from plane.db.models import User


class Command(BaseCommand):
    help = "Check if instance in registered else register"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument(
            "machine_signature", type=str, help="Machine signature"
        )

    def handle(self, *args, **options):
        # Check if the instance is registered
        instance = Instance.objects.first()

        # Get the environment variables
        license_version = os.environ.get("LICENSE_VERSION", False)
        prime_host = os.environ.get("PRIME_HOST", False)
        license_key = os.environ.get("LICENSE_KEY", False)
        domain = os.environ.get("LICENSE_DOMAIN", False)

        # If instance is None then register this instance
        if instance is None:
            # Get the machine signature from the options
            machine_signature = options.get(
                "machine_signature", "machine-signature"
            )

            if not machine_signature:
                raise CommandError("Machine signature is required")

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
                response.raise_for_status()
                data = response.json()
            else:
                with open("package.json", "r") as file:
                    # Load JSON content from the file
                    data = json.load(file)
                    license_version = data.get("version", 0.1)

            # Make a call to the Prime Server to get the instance
            instance = Instance.objects.create(
                instance_name="Plane Enterprise Edition",
                instance_id=data.get("instance_id", secrets.token_hex(12)),
                license_key=None,
                api_key=secrets.token_hex(8),
                current_version=data.get("user_version", license_version),
                latest_version=data.get("latest_version", license_version),
                last_checked_at=timezone.now(),
                user_count=User.objects.filter(is_bot=False).count(),
                domain=domain,
                product=data.get("product", "Plane Enterprise Edition"),
            )

            self.stdout.write(self.style.SUCCESS("Instance registered"))
        else:
            if license_version and license_key and prime_host:
                response = requests.get(
                    f"{prime_host}/api/instance/me/",
                    headers={
                        "Content-Type": "application/json",
                        "X-Machine-Signature": str(machine_signature),
                        "X-Api-Key": str(license_key),
                    },
                )
                response.raise_for_status()
                data = response.json()
            else:
                with open("package.json", "r") as file:
                    # Load JSON content from the file
                    data = json.load(file)
                    license_version = data.get("version", 0.1)

            # Update the instance
            instance.instance_id = data.get(
                "instance_id", instance.instance_id
            )
            instance.latest_version = data.get(
                "latest_version", instance.latest_version
            )
            instance.current_version = data.get(
                "user_version", instance.current_version
            )
            instance.user_count = User.objects.filter(is_bot=False).count()
            instance.last_checked_at = timezone.now()
            # Save the instance
            instance.save(
                update_fields=[
                    "instance_id",
                    "latest_version",
                    "current_version",
                    "user_count",
                    "last_checked_at",
                ]
            )

            # Print the success message
            self.stdout.write(
                self.style.SUCCESS("Instance already registered")
            )
            return
