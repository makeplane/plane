# Python imports
import json
from typing import Optional, List, Dict

# Django imports
from django.utils import timezone
from django.db import transaction

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    Issue,
    IssueVersion,
    IssueDescriptionVersion,
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
        print("====== Issue detail update ======")
        current_issue = json.loads(updated_issue) if updated_issue else {}
        issue = Issue.objects.get(id=issue_id)

        updated_current_issue = {}
        for key, value in current_issue.items():
            if getattr(issue, key) != value:
                updated_current_issue[key] = value

        if updated_current_issue:
            issue_version = (
                IssueVersion.objects.filter(issue_id=issue_id)
                .order_by("-last_saved_at")
                .first()
            )

            if (
                issue_version
                and str(issue_version.owned_by) == str(user_id)
                and (timezone.now() - issue_version.last_saved_at).total_seconds()
                <= 600
            ):
                for key, value in updated_current_issue.items():
                    setattr(issue_version, key, value)
                issue_version.last_saved_at = timezone.now()
                issue_version.save(
                    update_fields=list(updated_current_issue.keys()) + ["last_saved_at"]
                )
            else:
                IssueVersion.log_issue_version(issue, user_id)

        return
    except Issue.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        return


@shared_task
def issue_description_task(updated_issue, issue_id, user_id):
    try:
        print("====== Issue description update ======")
        current_issue = json.loads(updated_issue) if updated_issue else {}
        issue = Issue.objects.get(id=issue_id)

        current_issue_description_html = current_issue.get("description_html")
        issue_description_html = issue.description_html

        if current_issue_description_html != issue_description_html:
            issue_description_version = (
                IssueVersion.objects.filter(issue_id=issue_id)
                .order_by("-last_saved_at")
                .first()
            )

            current_issue_description_json = current_issue.get("description")
            current_issue_description_html = current_issue.get("description_html")
            current_issue_description_binary = current_issue.get("description_binary")
            current_issue_description_stripped = current_issue.get(
                "description_stripped"
            )

            if (
                issue_description_version
                and str(issue_description_version.owned_by) == str(user_id)
                and (
                    timezone.now() - issue_description_version.last_saved_at
                ).total_seconds()
                <= 600
            ):
                issue_description_version.description_json = (
                    current_issue_description_json
                )
                issue_description_version.description_html = (
                    current_issue_description_html
                )
                issue_description_version.description_binary = (
                    current_issue_description_binary
                )
                issue_description_version.description_stripped = (
                    current_issue_description_stripped
                )
                issue_description_version.last_saved_at = timezone.now()
                issue_description_version.save(
                    update_fields=[
                        "description_json",
                        "description_html",
                        "description_binary",
                        "description_stripped",
                        "last_saved_at",
                    ]
                )
            else:
                IssueDescriptionVersion.log_issue_description_version(
                    current_issue, user_id
                )

            return
    except Issue.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        return


@shared_task
def issue_versioning_task(updated_issue, issue_id, user_id):
    try:
        issue_task.delay(updated_issue, issue_id, user_id)
        issue_description_task.delay(updated_issue, issue_id, user_id)
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


# ============ Issue versioning management task starts ============
def get_related_data(issue_ids: List[int]) -> Dict:
    """Get related data for the given issue IDs"""

    cycle_issues = {
        ci.issue_id: ci.cycle_id
        for ci in CycleIssue.objects.filter(issue_id__in=issue_ids)
    }

    assignees = {
        issue_id: list(assignee_ids)
        for issue_id, assignee_ids in (
            IssueAssignee.objects.filter(issue_id__in=issue_ids)
            .values_list("issue_id", "assignee_id")
            .order_by("issue_id")
        ).groupby("issue_id")
    }

    labels = {
        issue_id: list(label_ids)
        for issue_id, label_ids in (
            IssueLabel.objects.filter(issue_id__in=issue_ids)
            .values_list("issue_id", "label_id")
            .order_by("issue_id")
        ).groupby("issue_id")
    }

    modules = {
        issue_id: list(module_ids)
        for issue_id, module_ids in (
            ModuleIssue.objects.filter(issue_id__in=issue_ids)
            .values_list("issue_id", "module_id")
            .order_by("issue_id")
        ).groupby("issue_id")
    }

    latest_activities = {
        ia.issue_id: ia.id
        for ia in IssueActivity.objects.filter(issue_id__in=issue_ids)
        .order_by("issue_id", "-created_at")
        .distinct("issue_id")
    }

    return {
        "cycle_issues": cycle_issues,
        "assignees": assignees,
        "labels": labels,
        "modules": modules,
        "activities": latest_activities,
    }


def create_issue_version(issue: Issue, related_data: Dict) -> Optional[IssueVersion]:
    """Create IssueVersion object from the given issue and related data"""

    if not issue.workspace_id or not issue.project_id:
        print(f"Skipping issue {issue.id} - missing workspace_id or project_id")
        return None

    owned_by_id = get_owner_id(issue)
    if owned_by_id is None:
        print(f"Skipping issue {issue.id} - missing owned_by")
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
        point=issue.point,
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


@shared_task
def issue_management_command_task(batch_size=5000, offset=0, countdown=300):
    """Task to create IssueVersion records for existing Issues in batches"""

    try:
        with transaction.atomic():
            # Get processed issues and total count
            processed_issue_ids = set(
                IssueVersion.objects.values_list("issue_id", flat=True).distinct()
            )

            base_query = Issue.objects.exclude(id__in=processed_issue_ids)
            total_issues_count = base_query.count()

            if total_issues_count == 0:
                return

            end_offset = min(offset + batch_size, total_issues_count)

            # Get issues batch with optimized queries
            issues_batch = list(
                base_query.order_by("created_at")
                .select_related("workspace", "project")
                .all()[offset:end_offset]
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
                issue_management_command_task.apply_async(
                    args=[batch_size, end_offset], countdown=countdown
                )
            return
    except Exception as e:
        log_exception(e)
        return


@shared_task
def schedule_issue_management_command_task(batch_size=5000, countdown=300):
    issue_management_command_task.delay(batch_size=batch_size, countdown=countdown)


# ============ Issue versioning management task ends ============


# ============ Issue description versioning management task starts ============
@shared_task
def issue_description_management_command_task(batch_size=5000, offset=0, countdown=300):
    """Task to create IssueDescriptionVersion records for existing Issues in batches"""

    try:
        with transaction.atomic():
            # Get processed issue IDs and total count
            processed_ids = set(
                IssueDescriptionVersion.objects.values_list(
                    "issue_id", flat=True
                ).distinct()
            )

            base_query = Issue.objects.exclude(id__in=processed_ids)
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
                    "description",
                )[offset:end_offset]
            )

            if not issues_batch:
                return

            version_objects = []
            for issue in issues_batch:
                # Validate required fields
                if not issue.workspace_id or not issue.project_id:
                    print(f"Skipping {issue.id} - missing workspace_id or project_id")
                    continue

                # Determine owned_by_id
                owned_by_id = get_owner_id(issue)
                if owned_by_id is None:
                    print(f"Skipping issue {issue.id} - missing owned_by")
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
                        description_json=issue.description,
                    )
                )

            # Bulk create version objects
            if version_objects:
                IssueDescriptionVersion.objects.bulk_create(version_objects)

            # Schedule next batch if needed
            if end_offset < total_issues_count:
                issue_description_management_command_task.apply_async(
                    args=[batch_size, end_offset], countdown=countdown
                )
        return
    except Exception as e:
        log_exception(e)
        return


@shared_task
def schedule_issue_description_management_command_task(batch_size=5000, countdown=300):
    issue_description_management_command_task.delay(
        batch_size=batch_size, countdown=countdown
    )


# ============ Issue description versioning management task nds ============
