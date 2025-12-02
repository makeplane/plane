# Django imports
from django.core.management.base import BaseCommand
from django.db import transaction

# Module imports
from plane.db.models import Description
from plane.db.models import Page


class Command(BaseCommand):
    help = "Create Description records for existing Page"

    def handle(self, *args, **kwargs):
        batch_size = 2000
        total_processed = 0

        self.stdout.write(self.style.NOTICE("Starting Page to Description migration..."))

        while True:
            pages = list(Page.objects.filter(description_obj_id__isnull=True).order_by("created_at")[:batch_size])

            if not pages:
                break

            with transaction.atomic():
                descriptions = [
                    Description(
                        created_at=page.created_at,
                        updated_at=page.updated_at,
                        description_json=page.description,
                        description_html=page.description_html,
                        description_stripped=page.description_stripped,
                        project_id=None,  # Pages are workspace-level, not project-level
                        created_by_id=page.created_by_id,
                        updated_by_id=page.updated_by_id,
                        workspace_id=page.workspace_id,
                    )
                    for page in pages
                ]

                created_descriptions = Description.objects.bulk_create(descriptions)

                pages_to_update = []
                for page, description in zip(pages, created_descriptions):
                    page.description_obj_id = description.id
                    pages_to_update.append(page)

                Page.objects.bulk_update(pages_to_update, ["description_obj_id"])

            total_processed += len(pages)
            self.stdout.write(self.style.SUCCESS(f"Processed {total_processed} pages..."))

        self.stdout.write(
            self.style.SUCCESS(f"Successfully copied {total_processed} Page records to Description table")
        )
