# Python imports
import json
import os
import requests

# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.conf import settings

# Module imports
from plane.license.models import Instance
from plane.db.models import User

class Command(BaseCommand):
    help = "Check if instance in registered else register"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument('machine_signature', type=str, help='Machine signature')


    def handle(self, *args, **options):
        # Check if the instance is registered
        instance = Instance.objects.first()

        # If instance is None then register this instance
        if instance is None:
            with open("package.json", "r") as file:
                # Load JSON content from the file
                data = json.load(file)

            machine_signature = options.get("machine_signature", False)
            

            if not machine_signature:
                raise CommandError("Machine signature is required")

            headers = {"Content-Type": "application/json"}

            payload = {
                "instance_key": settings.INSTANCE_KEY,
                "version": data.get("version", 0.1),
                "machine_signature": machine_signature,
                "user_count": User.objects.filter(is_bot=False).count(),
            }

            response = requests.post(
                f"{settings.LICENSE_ENGINE_BASE_URL}/api/instances/",
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
                    last_checked_at=timezone.now(),
                    user_count=data.get("user_count", 0),
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Instance successfully registered"
                    )
                )
                return
            raise CommandError("Instance could not be registered")
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Instance already registered"
                )
            )
            return
