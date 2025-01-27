# Django imports
from django.core.management import BaseCommand

# Module imports
from plane.payment.bgtasks.free_seat_sync import schedule_workspace_license_free_seats


class Command(BaseCommand):
    help = "Sync the free seats for a workspace with the payment server"

    def handle(self, *args, **options):
        batch_size = input("Enter the batch size: ")
        batch_countdown = input("Enter the batch countdown: ")

        # Trigger the member sync task with the workspace slug
        schedule_workspace_license_free_seats.delay(
            batch_size=int(batch_size), batch_countdown=int(batch_countdown)
        )

        # Print the success message
        self.stdout.write(
            self.style.SUCCESS("Successfully triggered the free seat sync task")
        )
        return
