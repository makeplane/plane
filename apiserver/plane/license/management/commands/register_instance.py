# Python imports
import json
import secrets

# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.conf import settings

# Module imports
from plane.license.models import Instance
from plane.db.models import (
    User,
)
from plane.license.bgtasks.tracer import instance_traces


class Command(BaseCommand):
    help = "Check if instance in registered else register"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument(
            "machine_signature", type=str, help="Machine signature"
        )

    def read_package_json(self):
        with open("package.json", "r") as file:
            # Load JSON content from the file
            data = json.load(file)

        payload = {
            "instance_key": settings.INSTANCE_KEY,
            "version": data.get("version", 0.1),
            "user_count": User.objects.filter(is_bot=False).count(),
        }
        return payload

    def handle(self, *args, **options):
        # Check if the instance is registered
        instance = Instance.objects.first()

        # If instance is None then register this instance
        if instance is None:
            machine_signature = options.get(
                "machine_signature", "machine-signature"
            )

            if not machine_signature:
                raise CommandError("Machine signature is required")

            payload = self.read_package_json()

            instance = Instance.objects.create(
                instance_name="Plane Community Edition",
                instance_id=secrets.token_hex(12),
                license_key=None,
                current_version=payload.get("version"),
                latest_version=payload.get("version"),
                last_checked_at=timezone.now(),
                user_count=payload.get("user_count", 0),
            )

            self.stdout.write(self.style.SUCCESS("Instance registered"))
        else:
            self.stdout.write(
                self.style.SUCCESS("Instance already registered")
            )
            payload = self.read_package_json()
            # Update the instance details
            instance.last_checked_at = timezone.now()
            instance.user_count = payload.get("user_count", 0)
            instance.current_version = payload.get("version")
            instance.latest_version = payload.get("version")
            instance.save()

        # Call the instance traces task
        instance_traces.delay()

        return
