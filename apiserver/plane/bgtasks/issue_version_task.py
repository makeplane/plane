# Python imports
import json

# Django imports
from django.utils import timezone

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Issue, IssueVersion
from plane.utils.exception_logger import log_exception


@shared_task
def issue_version_task(
    issue_id,
    existing_instance,
    user_id,
):
    try:

        # Get the current instance
        current_instance = (
            json.loads(existing_instance) if existing_instance is not None else {}
        )

        # Get the issue
        issue = Issue.objects.get(id=issue_id)

        # Create a version if description_html is updated
        if current_instance.get("description_html") != issue.description_html:
            # Fetch the latest issue version
            issue_version = (
                IssueVersion.objects.filter(issue_id=issue_id)
                .order_by("-last_saved_at")
                .first()
            )

            # Get the latest issue version if it exists and is owned by the user
            if (
                issue_version
                and str(issue_version.owned_by) == str(user_id)
                and (timezone.now() - issue_version.last_saved_at).total_seconds()
                <= 600
            ):
                issue_version.description = issue.description
                issue_version.description_html = issue.description_html
                issue_version.description_binary = issue.description_binary
                issue_version.description_stripped = issue.description_stripped
                issue_version.last_saved_at = timezone.now()
                issue_version.save(
                    update_fields=[
                        "description",
                        "description_html",
                        "description_binary",
                        "description_stripped",
                        "last_saved_at",
                    ]
                )
            else:
                # Create a new issue version
                IssueVersion.objects.create(
                    issue_id=issue_id,
                    workspace_id=issue.workspace_id,
                    description=issue.description,
                    description_html=issue.description_html,
                    description_binary=issue.description_binary,
                    description_stripped=issue.description_stripped,
                    owned_by=user_id,
                    last_saved_at=issue.updated_at,
                    project_id=issue.project_id,
                    created_by_id=issue.created_by_id,
                    updated_by_id=issue.updated_by_id,
                    priority=issue.priority,

                )
        return
    except Issue.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        return
