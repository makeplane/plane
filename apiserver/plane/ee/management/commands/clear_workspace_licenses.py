# Django imports
from django.core.management import BaseCommand

# Module imports
from plane.ee.models import WorkspaceLicense


class Command(BaseCommand):
    help = "Clear the workspace licenses on the start up"

    def handle(self, *args, **options):
        # Hard Delete all workspace licenses
        WorkspaceLicense.all_objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Workspace licenses cleared successfully"))
        return
