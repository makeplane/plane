# Python imports
import getpass

# Django imports
from django.core.management import BaseCommand

# Module imports
from plane.db.models import User


class Command(BaseCommand):
    help = "Check the file asset size of the file"


    def handle(self, *args, **options):

        from plane.bgtasks.file_asset_task import file_asset_size

        file_asset_size.delay()

        self.stdout.write(
            self.style.SUCCESS(f"File asset size pushed to queue")
        )
