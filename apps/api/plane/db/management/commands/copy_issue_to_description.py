# Django imports
from django.core.management.base import BaseCommand
from django.db import transaction

# Module imports
from plane.db.models import Description
from plane.db.models import Issue


class Command(BaseCommand):
    help = "Create Description records for existing Issue"

    def handle(self, *args, **kwargs):
        batch_size = 3000
        total_processed = 0

        self.stdout.write(self.style.NOTICE("Starting Issue to Description migration..."))

        while True:
            issues = list(Issue.objects.filter(description_obj_id__isnull=True).order_by("created_at")[:batch_size])

            if not issues:
                break

            with transaction.atomic():
                descriptions = [
                    Description(
                        created_at=issue.created_at,
                        updated_at=issue.updated_at,
                        description_json=issue.description,
                        description_html=issue.description_html,
                        description_stripped=issue.description_stripped,
                        project_id=issue.project_id,
                        created_by_id=issue.created_by_id,
                        updated_by_id=issue.updated_by_id,
                        workspace_id=issue.workspace_id,
                    )
                    for issue in issues
                ]

                created_descriptions = Description.objects.bulk_create(descriptions)

                issues_to_update = []
                for issue, description in zip(issues, created_descriptions):
                    issue.description_obj_id = description.id
                    issues_to_update.append(issue)

                Issue.objects.bulk_update(issues_to_update, ["description_obj_id"])

            total_processed += len(issues)
            self.stdout.write(self.style.SUCCESS(f"Processed {total_processed} issues..."))

        self.stdout.write(
            self.style.SUCCESS(f"Successfully copied {total_processed} Issue records to Description table")
        )
