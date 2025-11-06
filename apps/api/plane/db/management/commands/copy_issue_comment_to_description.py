# Django imports
from django.core.management.base import BaseCommand
from django.db import transaction

# Module imports
from plane.db.models import Description
from plane.db.models import IssueComment


class Command(BaseCommand):
    help = "Create Description records for existing IssueComment"

    def handle(self, *args, **kwargs):
        issue_comments = IssueComment.objects.filter(deleted_at__isnull=True, description_id__isnull=True)

        total = issue_comments.count()

        batch_size = 500

        for i in range(0, total, batch_size):
            with transaction.atomic():
                comments = list(issue_comments[i : i + batch_size])

                descriptions = [
                    Description(
                        created_at=comment.created_at,
                        updated_at=comment.updated_at,
                        description_json=comment.comment_json,
                        description_html=comment.comment_html,
                        description_stripped=comment.comment_stripped,
                        project_id=comment.project_id,
                        created_by_id=comment.created_by_id,
                        updated_by_id=comment.updated_by_id,
                        workspace_id=comment.workspace_id,
                    )
                    for comment in comments
                ]

                created_descriptions = Description.objects.bulk_create(descriptions)

                comments_to_update = []
                for comment, description in zip(comments, created_descriptions):
                    comment.description_id = description.id
                    comments_to_update.append(comment)

                IssueComment.objects.bulk_update(comments_to_update, ["description"])

            self.stdout.write(self.style.SUCCESS("Successfully Copied IssueComment to Description"))
