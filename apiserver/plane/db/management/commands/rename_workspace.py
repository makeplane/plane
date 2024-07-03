# Django imports
from django.core.management import BaseCommand, CommandError

# Module imports
from plane.db.models import Workspace
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS


class Command(BaseCommand):
    help = "Rename the workspace slug"

    def handle(self, *args, **options):
        # Get the old and new slug from console
        old_slug = input("Enter the slug of the workspace: ")
        new_slug = input("Enter the new slug of the workspace: ")

        # raise error if email is not present
        if not old_slug or not new_slug:
            raise CommandError("Error: Old and new slugs are required")

        # filter the user
        workspace = Workspace.objects.filter(slug=old_slug).first()

        # Raise error if the user is not present
        if not workspace:
            raise CommandError(
                f"Error: Workspace with {old_slug} does not exists"
            )

        if new_slug in RESTRICTED_WORKSPACE_SLUGS:
            raise CommandError(
                f"Error: {new_slug} is a restricted workspace slug"
            )

        # Activate the user
        workspace.slug = new_slug
        workspace.save()

        self.stdout.write(self.style.SUCCESS("Workspace renamed succesfully"))
