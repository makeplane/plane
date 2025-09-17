# Django imports
from django.core.management import BaseCommand

# Module imports
from plane.payment.bgtasks.member_sync_task import member_sync_task


class Command(BaseCommand):
    help = "Sync the license user for a workspace with the payment server"

    def handle(self, *args, **options):
        # Get the slug of the workspace
        workspace_slug = input("Enter the workspace slug: ")

        # Trigger the member sync task with the workspace slug
        member_sync_task.delay(workspace_slug)

        # Print the success message
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully triggered the member sync task for workspace: {workspace_slug}"
            )
        )
        return
