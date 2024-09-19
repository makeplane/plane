# Python imports
import json
import secrets
import os
import requests

# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

# Module imports
from plane.license.models import Instance, ChangeLog
from plane.db.models import User
from plane.utils.exception_logger import log_exception


class Command(BaseCommand):
    help = "Check if instance in registered else register"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument(
            "machine_signature", type=str, help="Machine signature"
        )

    def get_instance_from_prime(
        self, machine_signature, instance_id, prime_host
    ):
        try:
            response = requests.get(
                f"{prime_host}/api/v2/instances/me/",
                headers={
                    "Content-Type": "application/json",
                    "X-Machine-Signature": str(machine_signature),
                    "x-instance-id": str(instance_id),
                },
            )
            response.raise_for_status()
            data = response.json()
            return data
        except Exception as e:
            log_exception(e)
            return {}

    def get_instance_release_notes(
        self, machine_signature, instance_id, prime_host
    ):
        try:
            response = requests.get(
                f"{prime_host}/api/v2/release-notes/",
                headers={
                    "Content-Type": "application/json",
                    "X-Machine-Signature": str(machine_signature),
                    "x-instance-id": str(instance_id),
                },
            )
            response.raise_for_status()
            data = response.json()
            return data
        except Exception as e:
            log_exception(e)
            return []

    def get_fallback_version(self):
        with open("package.json", "r") as file:
            # Load JSON content from the file
            data = json.load(file)
            return data.get("version", 0.1)

    def update_change_log(self, release_notes):
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

    def handle(self, *args, **options):
        # Check if the instance is registered
        instance = Instance.objects.first()

        # Get the environment variables
        app_version = os.environ.get("APP_VERSION", False)
        prime_host = os.environ.get("PRIME_HOST", False)
        domain = os.environ.get("APP_DOMAIN", False)
        instance_id = os.environ.get("INSTANCE_ID", False)
        # Get the machine signature from the options
        machine_signature = options.get(
            "machine_signature", "machine-signature"
        )

        if not machine_signature:
            raise CommandError("Machine signature is required")

        # If instance is None then register this instance
        if instance is None:

            # If license version is not provided then read from package.json
            if app_version and prime_host and instance_id:
                data = self.get_instance_from_prime(
                    machine_signature=machine_signature,
                    instance_id=instance_id,
                    prime_host=prime_host,
                )
                release_notes = self.get_instance_release_notes(
                    machine_signature=machine_signature,
                    instance_id=instance_id,
                    prime_host=prime_host,
                )
            else:
                data = {}
                app_version = self.get_fallback_version()
                release_notes = []

            # Make a call to the Prime Server to get the instance
            instance = Instance.objects.create(
                instance_name="Plane Enterprise Edition",
                instance_id=data.get("instance_id", secrets.token_hex(12)),
                license_key=None,
                current_version=data.get("user_version", app_version),
                latest_version=data.get("latest_version", app_version),
                last_checked_at=timezone.now(),
                user_count=User.objects.filter(is_bot=False).count(),
                domain=domain,
                product=data.get("product", "Plane Enterprise Edition"),
            )

            self.update_change_log(release_notes)

            self.stdout.write(self.style.SUCCESS("Instance registered"))
        else:
            data = {}
            # Fetch the instance from the Prime Server
            if app_version and instance_id and prime_host:
                data = self.get_instance_from_prime(
                    machine_signature=machine_signature,
                    instance_id=instance_id,
                    prime_host=prime_host,
                )
                release_notes = self.get_instance_release_notes(
                    machine_signature=machine_signature,
                    instance_id=instance_id,
                    prime_host=prime_host,
                )
                data["user_version"] = app_version
            else:
                app_version = self.get_fallback_version()
                release_notes = []

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
            instance.product = "Plane Enterprise Edition"
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
                    "product",
                ]
            )

            self.update_change_log(release_notes)

            # Print the success message
            self.stdout.write(
                self.style.SUCCESS("Instance already registered")
            )
            return
