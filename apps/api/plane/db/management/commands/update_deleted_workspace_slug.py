from django.core.management.base import BaseCommand
from django.db import transaction
from plane.db.models import Workspace


class Command(BaseCommand):
    help = (
        "Updates the slug of a soft-deleted workspace by appending the epoch timestamp"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "slug",
            type=str,
            help="The slug of the workspace to update",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run the command without making any changes",
        )

    def handle(self, *args, **options):
        slug = options["slug"]
        dry_run = options["dry_run"]

        # Get the workspace with the specified slug
        try:
            workspace = Workspace.all_objects.get(slug=slug)
        except Workspace.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f"Workspace with slug '{slug}' not found.")
            )
            return

        # Check if the workspace is soft-deleted
        if workspace.deleted_at is None:
            self.stdout.write(
                self.style.WARNING(
                    f"Workspace '{workspace.name}' (slug: {workspace.slug}) is not deleted."
                )
            )
            return

        # Check if the slug already has a timestamp appended
        if "__" in workspace.slug and workspace.slug.split("__")[-1].isdigit():
            self.stdout.write(
                self.style.WARNING(
                    f"Workspace '{workspace.name}' (slug: {workspace.slug}) already has a timestamp appended."
                )
            )
            return

        # Get the deletion timestamp
        deletion_timestamp = int(workspace.deleted_at.timestamp())

        # Create the new slug with the deletion timestamp
        new_slug = f"{workspace.slug}__{deletion_timestamp}"

        if dry_run:
            self.stdout.write(
                f"Would update workspace '{workspace.name}' slug from '{workspace.slug}' to '{new_slug}'"
            )
        else:
            try:
                with transaction.atomic():
                    workspace.slug = new_slug
                    workspace.save(update_fields=["slug"])
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Updated workspace '{workspace.name}' slug from '{workspace.slug}' to '{new_slug}'"
                        )
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"Error updating workspace '{workspace.name}': {str(e)}"
                    )
                )
