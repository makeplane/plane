# Python imports
import secrets
import os
import requests

# Django imports
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

# Module imports
from plane.license.models import Instance, InstanceEdition
from plane.utils.exception_logger import log_exception
from plane.license.bgtasks.tracer import instance_traces


class Command(BaseCommand):
    help = "Check if instance in registered else register"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("machine_signature", type=str, help="Machine signature")

    def get_instance_from_prime(self, machine_signature, prime_host):
        try:
            if settings.IS_AIRGAPPED:
                return {}

            response = requests.get(
                f"{prime_host}/api/v2/instances/me/",
                headers={
                    "Content-Type": "application/json",
                    "X-Machine-Signature": str(machine_signature),
                },
            )
            response.raise_for_status()
            data = response.json()
            return data
        except Exception as e:
            log_exception(e)
            return {}

    def handle(self, *args, **options):
        # Check if the instance is registered
        instance = Instance.objects.first()

        domain = os.environ.get("APP_DOMAIN", False)
        if not domain:
            raise CommandError("App domain is required")

        app_version = os.environ.get("APP_VERSION", False)
        if not app_version:
            raise CommandError("App version is required")

        prime_host = os.environ.get("PRIME_HOST", False)
        if not prime_host:
            raise CommandError("Prime host is required")

        machine_signature = options.get("machine_signature", "machine-signature")
        if not machine_signature:
            raise CommandError("Machine signature is required")

        data = self.get_instance_from_prime(
            machine_signature=machine_signature, prime_host=prime_host
        )

        # If instance is None then register this instance
        if instance is None:
            # Make a call to the Prime Server to get the instance
            instance = Instance.objects.create(
                instance_name="Plane Commercial Edition",
                instance_id=data.get("instance_id", secrets.token_hex(12)),
                current_version=data.get("user_version", app_version),
                latest_version=data.get("latest_version", app_version),
                last_checked_at=timezone.now(),
                domain=domain,
                edition=InstanceEdition.PLANE_COMMERCIAL.value,
                is_test=os.environ.get("IS_TEST", "0") == "1",
            )

            self.stdout.write(self.style.SUCCESS("Instance registered"))
            return
        else:
            # Update the instance
            instance.instance_id = data.get("instance_id", instance.instance_id)
            instance.latest_version = data.get(
                "latest_version", instance.latest_version
            )
            instance.current_version = data.get("user_version", app_version)
            instance.edition = InstanceEdition.PLANE_COMMERCIAL.value
            instance.last_checked_at = timezone.now()
            instance.is_test = os.environ.get("IS_TEST", "0") == "1"
            # Save the instance
            instance.save(
                update_fields=[
                    "instance_id",
                    "latest_version",
                    "current_version",
                    "last_checked_at",
                    "edition",
                    "is_test",
                ]
            )

            # Capture telemetry data
            instance_traces.delay()

            # Print the success message
            self.stdout.write(self.style.SUCCESS("Instance already registered"))
            return
