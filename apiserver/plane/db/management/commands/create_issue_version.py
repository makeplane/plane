# Django imports
from django.core.management.base import BaseCommand

# Module imports
from plane.bgtasks.issue_version_task import schedule_issue_management_command_task


class Command(BaseCommand):
    help = "Creates IssueVersion records for existing Issues in batches"

    def handle(self, *args, **options):
        batch_size = input("Enter the batch size: ")
        batch_countdown = input("Enter the batch countdown: ")

        schedule_issue_management_command_task.delay(
            batch_size=int(batch_size), countdown=int(batch_countdown)
        )

        self.stdout.write(self.style.SUCCESS("Successfully created issue version task"))
