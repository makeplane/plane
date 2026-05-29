# Python imports
import json
from typing import Optional, List, Dict
from uuid import UUID
from itertools import groupby
import logging

# Django imports
from django.utils import timezone
from django.db import transaction

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    Issue,
    IssueVersion,
    ProjectMember,
    CycleIssue,
    ModuleIssue,
    IssueActivity,
    IssueAssignee,
    IssueLabel,
)
from plane.utils.exception_logger import log_exception


@shared_task
def issue_task(updated_issue, issue_id, user_id):
    try:
        current_issue = json.loads(updated_issue) if updated_issue else {}
        issue = Issue.objects.get(id=issue_id)

        updated_current_issue = {}
        for key, value in current_issue.items():
            if getattr(issue, key) != value:
                updated_current_issue[key] = value

        if updated_current_issue:
            issue_version = IssueVersion.objects.filter(issue_id=issue_id).order_by("-last_saved_at").first()

            if (
                issue_version
                and str(issue_version.owned_by) == str(user_id)
                and (timezone.now() - issue_version.last_saved_at).total_seconds() <= 600
            ):
                for key, value in updated_current_issue.items():
                    setattr(issue_version, key, value)
                issue_version.last_saved_at = timezone.now()
                issue_version.save(update_fields=list(updated_current_issue.keys()) + ["last_saved_at"])
            else:
                IssueVersion.log_issue_version(issue, user_id)

        return
    except Issue.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        return


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


def get_related_data(issue_ids: List[UUID]) -> Dict:
    """Get related data for the given issue IDs"""

    cycle_issues = {ci.issue_id: ci.cycle_id for ci in CycleIssue.objects.filter(issue_id__in=issue_ids)}

    # Get assignees with proper grouping
    assignee_records = list(
        IssueAssignee.objects.filter(issue_id__in=issue_ids).values_list("issue_id", "assignee_id").order_by("issue_id")
    )
    assignees = {}
    for issue_id, group in groupby(assignee_records, key=lambda x: x[0]):
        assignees[issue_id] = [str(g[1]) for g in group]

    # Get labels with proper grouping
    label_records = list(
        IssueLabel.objects.filter(issue_id__in=issue_ids).values_list("issue_id", "label_id").order_by("issue_id")
    )
    labels = {}
    for issue_id, group in groupby(label_records, key=lambda x: x[0]):
        labels[issue_id] = [str(g[1]) for g in group]

    # Get modules with proper grouping
    module_records = list(
        ModuleIssue.objects.filter(issue_id__in=issue_ids).values_list("issue_id", "module_id").order_by("issue_id")
    )
    modules = {}
    for issue_id, group in groupby(module_records, key=lambda x: x[0]):
        modules[issue_id] = [str(g[1]) for g in group]

    # Get latest activities
    latest_activities = {}
    activities = IssueActivity.objects.filter(issue_id__in=issue_ids).order_by("issue_id", "-created_at")
    for issue_id, activities_group in groupby(activities, key=lambda x: x.issue_id):
        first_activity = next(activities_group, None)
        if first_activity:
            latest_activities[issue_id] = first_activity.id

    return {
        "cycle_issues": cycle_issues,
        "assignees": assignees,
        "labels": labels,
        "modules": modules,
        "activities": latest_activities,
    }


def create_issue_version(issue: Issue, related_data: Dict) -> Optional[IssueVersion]:
    """Create IssueVersion object from the given issue and related data"""

    try:
        if not issue.workspace_id or not issue.project_id:
            logging.warning(f"Skipping issue {issue.id} - missing workspace_id or project_id")
            return None

        owned_by_id = get_owner_id(issue)
        if owned_by_id is None:
            logging.warning(f"Skipping issue {issue.id} - missing owned_by")
            return None

        return IssueVersion(
            workspace_id=issue.workspace_id,
            project_id=issue.project_id,
            created_by_id=issue.created_by_id,
            updated_by_id=issue.updated_by_id,
            owned_by_id=owned_by_id,
            last_saved_at=timezone.now(),
            activity_id=related_data["activities"].get(issue.id),
            properties=getattr(issue, "properties", {}),
            meta=getattr(issue, "meta", {}),
            issue_id=issue.id,
            parent=issue.parent_id,
            state=issue.state_id,
            estimate_point=issue.estimate_point_id,
            name=issue.name,
            priority=issue.priority,
            start_date=issue.start_date,
            target_date=issue.target_date,
            assignees=related_data["assignees"].get(issue.id, []),
            sequence_id=issue.sequence_id,
            labels=related_data["labels"].get(issue.id, []),
            sort_order=issue.sort_order,
            completed_at=issue.completed_at,
            archived_at=issue.archived_at,
            is_draft=issue.is_draft,
            external_source=issue.external_source,
            external_id=issue.external_id,
            type=issue.type_id,
            cycle=related_data["cycle_issues"].get(issue.id),
            modules=related_data["modules"].get(issue.id, []),
        )
    except Exception as e:
        log_exception(e)
        return None


@shared_task
def sync_issue_version(batch_size=5000, offset=0, countdown=300):
    """Task to create IssueVersion records for existing Issues in batches"""

    try:
        with transaction.atomic():
            base_query = Issue.objects
            total_issues_count = base_query.count()

            if total_issues_count == 0:
                return

            end_offset = min(offset + batch_size, total_issues_count)

            # Get issues batch with optimized queries
            issues_batch = list(
                base_query.order_by("created_at").select_related("workspace", "project").all()[offset:end_offset]
            )

            if not issues_batch:
                return

            # Get all related data in bulk
            issue_ids = [issue.id for issue in issues_batch]
            related_data = get_related_data(issue_ids)

            issue_versions = []
            for issue in issues_batch:
                version = create_issue_version(issue, related_data)
                if version:
                    issue_versions.append(version)

            # Bulk create versions
            if issue_versions:
                IssueVersion.objects.bulk_create(issue_versions, batch_size=1000)

            # Schedule the next batch if there are more workspaces to process
            if end_offset < total_issues_count:
                sync_issue_version.apply_async(
                    kwargs={
                        "batch_size": batch_size,
                        "offset": end_offset,
                        "countdown": countdown,
                    },
                    countdown=countdown,
                )

            logging.info(f"Processed Issues: {end_offset}")
            return
    except Exception as e:
        log_exception(e)
        return


@shared_task
def schedule_issue_version(batch_size=5000, countdown=300):
    sync_issue_version.delay(batch_size=int(batch_size), countdown=countdown)
