# Django imports
from django.core.management import BaseCommand

# Module imports
from plane.payment.bgtasks.update_license_task import update_licenses


class Command(BaseCommand):
    help = "Sync the license user for a workspace with the payment server"

    def handle(self, *args, **options):
        # Trigger the sync license on startup task
        update_licenses.delay()

        # Print the success message
        self.stdout.write(
            self.style.SUCCESS(
                "Successfully triggered the sync license on startup task"
            )
        )
        return
