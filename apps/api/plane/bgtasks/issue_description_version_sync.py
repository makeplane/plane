# Python imports
from typing import Optional
import logging

# Django imports
from django.utils import timezone
from django.db import transaction

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Issue, IssueDescriptionVersion, ProjectMember
from plane.utils.exception_logger import log_exception


def get_owner_id(issue: Issue) -> Optional[int]:
    """Get the owner ID of the issue"""

    if issue.updated_by_id:
        return issue.updated_by_id

    if issue.created_by_id:
        return issue.created_by_id

    # Find project admin as fallback
    project_member = ProjectMember.objects.filter(
        project_id=issue.project_id,
        role=20,  # Admin role
    ).first()

    return project_member.member_id if project_member else None


@shared_task
def sync_issue_description_version(batch_size=5000, offset=0, countdown=300):
    """Task to create IssueDescriptionVersion records for existing Issues in batches"""
    try:
        with transaction.atomic():
            base_query = Issue.objects
            total_issues_count = base_query.count()

            if total_issues_count == 0:
                return

            # Calculate batch range
            end_offset = min(offset + batch_size, total_issues_count)

            # Fetch issues with related data
            issues_batch = (
                base_query.order_by("created_at")
                .select_related("workspace", "project")
                .only(
                    "id",
                    "workspace_id",
                    "project_id",
                    "created_by_id",
                    "updated_by_id",
                    "description_binary",
                    "description_html",
                    "description_stripped",
                    "description_json",
                )[offset:end_offset]
            )

            if not issues_batch:
                return

            version_objects = []
            for issue in issues_batch:
                # Validate required fields
                if not issue.workspace_id or not issue.project_id:
                    logging.warning(f"Skipping {issue.id} - missing workspace_id or project_id")
                    continue

                # Determine owned_by_id
                owned_by_id = get_owner_id(issue)
                if owned_by_id is None:
                    logging.warning(f"Skipping issue {issue.id} - missing owned_by")
                    continue

                # Create version object
                version_objects.append(
                    IssueDescriptionVersion(
                        workspace_id=issue.workspace_id,
                        project_id=issue.project_id,
                        created_by_id=issue.created_by_id,
                        updated_by_id=issue.updated_by_id,
                        owned_by_id=owned_by_id,
                        last_saved_at=timezone.now(),
                        issue_id=issue.id,
                        description_binary=issue.description_binary,
                        description_html=issue.description_html,
                        description_stripped=issue.description_stripped,
                        description_json=issue.description_json,
                    )
                )

            # Bulk create version objects
            if version_objects:
                IssueDescriptionVersion.objects.bulk_create(version_objects)

            # Schedule next batch if needed
            if end_offset < total_issues_count:
                sync_issue_description_version.apply_async(
                    kwargs={
                        "batch_size": batch_size,
                        "offset": end_offset,
                        "countdown": countdown,
                    },
                    countdown=countdown,
                )
        return
    except Exception as e:
        log_exception(e)
        return


@shared_task
def schedule_issue_description_version(batch_size=5000, countdown=300):
    sync_issue_description_version.delay(batch_size=int(batch_size), countdown=countdown)
