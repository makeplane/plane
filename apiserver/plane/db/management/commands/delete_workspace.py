# Django imports
from django.core.management import BaseCommand, CommandError

# Module imports
from plane.db.models import Workspace


class Command(BaseCommand):
    help = "Delete the workspace with the given slug"

    def handle(self, *args, **options):
        try:
            # Get the old and new slug from console
            slug = input("Enter the slug of the workspace: ")

            # raise error if email is not present
            if not slug:
                raise CommandError("Error: Slug is required")

            # filter the user
            workspace = Workspace.objects.filter(slug=slug).first()

            # Raise error if the user is not present
            if not workspace:
                raise CommandError(
                    f"Error: Workspace with {slug} does not exists"
                )

            # Activate the user
            workspace.delete()

            self.stdout.write(
                self.style.SUCCESS("Workspace deleted succesfully")
            )
        except Exception as e:
            raise CommandError(f"Error: {e}")
