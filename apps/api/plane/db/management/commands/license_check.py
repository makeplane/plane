# Python imports
import os
import requests
from requests.exceptions import RequestException

# Django imports
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Check the license of the instance with Prime Server"

    def handle(self, *args, **options):
        try:
            # Verify the license key
            prime_host = os.environ.get("PRIME_HOST", False)
            machine_signature = os.environ.get("MACHINE_SIGNATURE", False)
            license_key = os.environ.get("LICENSE_KEY", False)
            deploy_platform = os.environ.get("DEPLOY_PLATFORM", False)
            domain = os.environ.get("LICENSE_DOMAIN", False)
            license_version = os.environ.get("LICENSE_VERSION", False)

            # If any of the above is not provided raise a command error
            if not prime_host or not machine_signature or not license_key:
                raise CommandError("Invalid license key provided")

            # Check with the license server
            response = requests.post(
                f"{prime_host}/api/validate/",
                headers={
                    "Content-Type": "application/json",
                    "X-Api-Key": str(license_key),
                    "X-Machine-Signature": str(machine_signature),
                },
                json={"machine_signature": str(machine_signature), "domain": domain},
            )

            # Check if status code is 204
            if response.status_code == 204:
                self.stdout.write(
                    self.style.SUCCESS("License key verified successfully")
                )
                return

            elif response.status_code == 400:
                if deploy_platform == "KUBERNETES":
                    response = requests.post(
                        f"{prime_host}/api/kubernetes-setup/",
                        headers={
                            "Content-Type": "application/json",
                            "X-Api-Key": str(license_key),
                            "X-Machine-Signature": str(machine_signature),
                        },
                        json={
                            "machine_signature": str(machine_signature),
                            "domain": domain,
                            "version": license_version,
                        },
                    )
                    response.raise_for_status()
                    self.stdout.write(
                        self.style.SUCCESS("Instance created successfully")
                    )

                    return
                else:
                    raise CommandError("Instance does not exist")
            else:
                raise CommandError("Invalid license key provided")

        except RequestException:
            raise CommandError("Could not verify the license key")
