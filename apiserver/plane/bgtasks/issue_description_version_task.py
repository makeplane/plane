from celery import shared_task
from django.db import transaction
from django.utils import timezone
from typing import Optional, Dict, Any
import json

from plane.db.models import Issue, IssueDescriptionVersion
from plane.utils.logging import log_exception


def should_update_existing_version(
    version: IssueDescriptionVersion, user_id: str, max_time_difference: int = 600
) -> bool:
    if not version:
        return

    time_difference = (timezone.now() - version.last_saved_at).total_seconds()
    return (
        str(version.owned_by_id) == str(user_id)
        and time_difference <= max_time_difference
    )


def update_existing_version(
    version: IssueDescriptionVersion, description_data: Dict[str, Any]
) -> None:
    version.description_json = description_data.get("description")
    version.description_html = description_data.get("description_html")
    version.description_binary = description_data.get("description_binary")
    version.description_stripped = description_data.get("description_stripped")
    version.last_saved_at = timezone.now()

    version.save(
        update_fields=[
            "description_json",
            "description_html",
            "description_binary",
            "description_stripped",
            "last_saved_at",
        ]
    )


@shared_task
def issue_description_version_task(
    updated_issue: Optional[str], issue_id: str, user_id: str
) -> Optional[bool]:
    try:
        # Parse updated issue data
        current_issue: Dict = json.loads(updated_issue) if updated_issue else {}

        # Get current issue
        issue = Issue.objects.get(id=issue_id)

        # Check if description has changed
        if current_issue.get("description_html") == issue.description_html:
            return

        with transaction.atomic():
            # Get latest version
            latest_version = (
                IssueDescriptionVersion.objects.filter(issue_id=issue_id)
                .order_by("-last_saved_at")
                .first()
            )

            # Determine whether to update existing or create new version
            if should_update_existing_version(latest_version, user_id):
                update_existing_version(latest_version, current_issue)
            else:
                IssueDescriptionVersion.log_issue_description_version(
                    current_issue, user_id
                )

            return

    except Issue.DoesNotExist:
        # Issue no longer exists, skip processing
        return
    except json.JSONDecodeError as e:
        log_exception(f"Invalid JSON for updated_issue: {e}")
        return
    except Exception as e:
        log_exception(f"Error processing issue description version: {e}")
        return
