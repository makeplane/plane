# Python imports
import json
from typing import Dict, Any, Optional, List

# Django imports
from django.utils import timezone
from django.db import transaction

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Issue, IssueVersion
from plane.utils.exception_logger import log_exception


def get_changed_fields(current_issue: Dict[str, Any], issue: Issue) -> Dict[str, Any]:
    return {
        key: value
        for key, value in current_issue.items()
        if getattr(issue, key) != value
    }


def should_update_existing_version(
    version: Optional[IssueVersion], user_id: str, max_time_difference: int = 600
) -> bool:
    if not version:
        return False

    time_difference = (timezone.now() - version.last_saved_at).total_seconds()
    return (
        str(version.owned_by_id) == str(user_id)
        and time_difference <= max_time_difference
    )


def update_version_fields(
    version: IssueVersion, changed_fields: Dict[str, Any]
) -> List[str]:
    for key, value in changed_fields.items():
        setattr(version, key, value)

    version.last_saved_at = timezone.now()
    update_fields = list(changed_fields.keys()) + ["last_saved_at"]
    return update_fields


@shared_task
def issue_version_task(
    updated_issue: Optional[str], issue_id: str, user_id: str
) -> Optional[bool]:
    try:
        # Parse updated issue data
        current_issue: Dict = json.loads(updated_issue) if updated_issue else {}

        with transaction.atomic():
            # Get current issue
            issue = Issue.objects.get(id=issue_id)

            # Get changed fields
            changed_fields = get_changed_fields(current_issue, issue)

            if not changed_fields:
                return True

            # Get latest version
            latest_version = (
                IssueVersion.objects.filter(issue_id=issue_id)
                .order_by("-last_saved_at")
                .first()
            )

            # Update existing or create new version
            if should_update_existing_version(latest_version, user_id):
                update_fields = update_version_fields(latest_version, changed_fields)
                latest_version.save(update_fields=update_fields)
            else:
                IssueVersion.log_issue_version(issue, user_id)

            return True

    except Issue.DoesNotExist:
        return None
    except json.JSONDecodeError as e:
        log_exception(f"Invalid JSON for updated_issue: {e}")
        return False
    except Exception as e:
        log_exception(f"Error processing issue version: {e}")
        return False
