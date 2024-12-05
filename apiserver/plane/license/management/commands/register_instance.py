# Python imports
import json
import secrets
import os

# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.conf import settings

# Module imports
from plane.license.models import Instance, InstanceEdition
from plane.license.bgtasks.tracer import instance_traces


class Command(BaseCommand):
    help = "Check if instance in registered else register"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("machine_signature", type=str, help="Machine signature")

    def read_package_json(self):
        with open("package.json", "r") as file:
            # Load JSON content from the file
            data = json.load(file)

        payload = {
            "instance_key": settings.INSTANCE_KEY,
            "version": data.get("version", 0.1),
        }
        return payload

    def handle(self, *args, **options):
        # Check if the instance is registered
        instance = Instance.objects.first()

        # If instance is None then register this instance
        if instance is None:
            machine_signature = options.get("machine_signature", "machine-signature")

            if not machine_signature:
                raise CommandError("Machine signature is required")

            payload = self.read_package_json()

            instance = Instance.objects.create(
                instance_name="Plane Community Edition",
                instance_id=secrets.token_hex(12),
                current_version=payload.get("version"),
                latest_version=payload.get("version"),
                last_checked_at=timezone.now(),
                is_test=os.environ.get("IS_TEST", "0") == "1",
                edition=InstanceEdition.PLANE_COMMUNITY.value,
            )

            self.stdout.write(self.style.SUCCESS("Instance registered"))
        else:
            self.stdout.write(self.style.SUCCESS("Instance already registered"))
            payload = self.read_package_json()
            # Update the instance details
            instance.last_checked_at = timezone.now()
            instance.current_version = payload.get("version")
            instance.latest_version = payload.get("version")
            instance.is_test = os.environ.get("IS_TEST", "0") == "1"
            instance.edition = InstanceEdition.PLANE_COMMUNITY.value
            instance.save()

        # Call the instance traces task
        instance_traces.delay()

        return
