# Django imports
from django.core.management.base import BaseCommand

# Module imports
from plane.bgtasks.issue_version_sync import schedule_issue_version


class Command(BaseCommand):
    help = "Creates IssueVersion records for existing Issues in batches"

    def handle(self, *args, **options):
        batch_size = input("Enter the batch size: ")
        batch_countdown = input("Enter the batch countdown: ")

        schedule_issue_version.delay(batch_size=batch_size, countdown=int(batch_countdown))

        self.stdout.write(self.style.SUCCESS("Successfully created issue version task"))
