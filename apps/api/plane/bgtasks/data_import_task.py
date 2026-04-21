# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import logging
import random
import uuid

# Third party imports
from celery import shared_task
import requests
from django.db import transaction, connection, models
from django.conf import settings

from plane.utils.exception_logger import log_exception
from plane.utils.uuid import convert_uuid_to_integer
from plane.utils.helpers import get_boolean_value
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.api.serializers.issue import IssueSerializer
from plane.db.models import (
    Issue,
    IssueLink,
    IssueComment,
    IssueLabel,
    IssueSubscriber,
    IssueSequence,
    IssueActivity,
    Estimate,
    EstimatePoint,
)
from plane.db.models.label import Label
from plane.db.models.project import Project
from plane.db.models.cycle import CycleIssue
from plane.db.models.module import ModuleIssue
from plane.db.models.workspace import Workspace
from plane.db.models.asset import FileAsset
from plane.db.models.page import Page, ProjectPage
from plane.ee.models import IssueProperty, IssuePropertyValue, IssueWorkLog
from plane.ee.utils.external_issue_property_validator import (
    externalIssuePropertyValueSaver,
    externalIssuePropertyValueValidator,
)
from plane.silo.bgtasks.bulk_update_issue_relations_task import (
    bulk_update_issue_relations_task,
)
from plane.ee.models import ImportExecutionLog

logger = logging.getLogger("plane.worker")


def collect_execution_log(logs, workspace_slug=None):
    """
    Abstracted function to collect execution logs and handle feature flags.
    Accepts either a single log dictionary or a list of log dictionaries.
    """
    if not logs:
        return None

    try:
        # Check for report_id
        first_log = logs[0] if isinstance(logs, list) else logs
        if not first_log.get("report_id"):
            return None

        # Check if we should create the log at all
        if workspace_slug and not check_workspace_feature_flag(FeatureFlag.IMPORT_SUMMARY, workspace_slug):
            return None

        if isinstance(logs, dict):
            # Ensure default values for JSON fields if missing
            for field in ["metrics", "error", "additional_data"]:
                if logs.get(field) is None:
                    logs[field] = {}
            return ImportExecutionLog.objects.create(**logs)

        if isinstance(logs, list):
            log_objs = []
            for log_data in logs:
                # Ensure default values for JSON fields if missing
                for field in ["metrics", "error", "additional_data"]:
                    if log_data.get(field) is None:
                        log_data[field] = {}
                log_objs.append(ImportExecutionLog(**log_data))

            if log_objs:
                return ImportExecutionLog.objects.bulk_create(log_objs, batch_size=100)

        return None
    except Exception as e:
        logger.warning(f"Failed to collect execution log: {str(e)}")
        return None


def dispatch_job_completion(job_id, phase="issues", is_last_batch=False):
    """Dispatch the job completion to silo service"""
    try:
        silo_url = settings.SILO_URL.rstrip("/")
        endpoint = f"{silo_url}/api/jobs/{job_id}/finished/"

        response = requests.post(
            endpoint,
            json={"jobId": job_id, "phase": phase, "isLastBatch": is_last_batch},
            headers={"Content-Type": "application/json"},
        )

        if response.status_code != 200:
            logger.error(
                "Error updating job batch completion",
                extra={
                    "jobId": job_id,
                    "phase": phase,
                    "isLastBatch": is_last_batch,
                },
            )

    except Exception as e:
        logger.error(
            "Failed to update job batch completion",
            extra={
                "jobId": job_id,
                "phase": phase,
                "isLastBatch": is_last_batch,
            },
        )
        log_exception(e)


def update_job_batch_completion(
    job_id,
    imported_batch_count=0,
    total_issues=0,
    imported_issues=0,
    phase="issues",
    is_last_batch=False,
):
    """Update the job report with batch and issue counts"""
    try:
        from plane.ee.models import ImportJob
        from django.utils import timezone

        # Use F() expressions to handle concurrency safely
        from django.db.models import F
        from django.db.models.functions import Coalesce

        # Get the job and its report
        job = ImportJob.objects.select_related("report").get(pk=job_id)

        # Get the model class from the instance
        ReportModel = job.report.__class__

        # Update counters atomically at database level
        ReportModel.objects.filter(id=job.report.id).update(
            # Coalesce handles NULL values by replacing them with 0 before adding
            imported_batch_count=Coalesce(F("imported_batch_count"), 0) + imported_batch_count,
            total_issue_count=Coalesce(F("total_issue_count"), 0) + total_issues,
            imported_issue_count=Coalesce(F("imported_issue_count"), 0) + imported_issues,
            errored_issue_count=Coalesce(F("errored_issue_count"), 0) + (total_issues - imported_issues),
            completed_batch_count=Coalesce(F("completed_batch_count"), 0) + (1 if imported_batch_count > 0 else 0),
            updated_at=timezone.now(),
        )

        # Refresh the object to get updated values
        job.report.refresh_from_db()

        logger.info(
            "Updated job batch completion",
            extra={
                "jobId": job_id,
                "isLastBatch": is_last_batch,
                "phase": phase,
                "imported_batch_count": imported_batch_count,
                "total_issues": total_issues,
                "imported_issues": imported_issues,
                "completed_batch_count": job.report.completed_batch_count,
                "total_batch_count": job.report.total_batch_count,
            },
        )

        # Check if all batches are processed and update job status
        if job.report.completed_batch_count >= job.report.total_batch_count or is_last_batch:
            """
            We'll make an api call to silo, such that silo can perform
            any additional processing along with marking the job as finished
            """
            bulk_update_issue_relations_task(job_id, user_id=job.initiator_id)
            dispatch_job_completion(job_id, phase, is_last_batch)

    except ImportJob.DoesNotExist:
        logger.error(
            "Job not found with id",
            extra={"jobId": job_id},
        )
    except Exception as e:
        logger.error(
            "Failed to update job batch completion",
            extra={"jobId": job_id},
        )
        log_exception(e)


def is_valid_uuid(value):
    """
    Check if a value is a valid UUID string.

    Args:
        value: The value to check

    Returns:
        bool: True if the value is a valid UUID, False otherwise
    """
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError):
        return False


def sanitize_issue_data(issue_data):
    """
    Sanitize the issue data
    """
    # limit the name to 255 characters
    issue_data["name"] = issue_data["name"][:255]

    return issue_data


def process_single_issue(slug, project, user_id, issue_data, report_id=None, job_id=None, preserve_sequence=False):
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT set_config('plane.initiator_type', 'SYSTEM.IMPORT', true)")

        # Process the main issue
        issue_data = sanitize_issue_data(issue_data)

        # Handle labels based on whether they are UUIDs or names
        labels = []
        if "labels" in issue_data:
            label_values = issue_data.get("labels", [])
            if label_values and not is_valid_uuid(label_values[0]):
                labels = issue_data.pop("labels")

        serializer = IssueSerializer(
            data=issue_data,
            context={
                "project_id": project.id,
                "workspace_id": project.workspace_id,
                "default_assignee_id": project.default_assignee_id,
            },
        )

        if not serializer.is_valid():
            logger.error(
                "Error processing issue",
                extra={"issueId": issue_data.get("id")},
            )
            # Create an exception for serializer.errors
            exception = Exception(serializer.errors)
            log_exception(exception)

            collect_execution_log(
                logs={
                    "report_id": report_id,
                    "job_id": job_id,
                    "entity_type": "WORK_ITEM",
                    "level": "error",
                    "phase": "PROCESS_ISSUES",
                    "error": {"message": str(serializer.errors)},
                    "additional_data": issue_data,
                    "is_fatal": False,
                },
                workspace_slug=slug,
            )
            return None

        external_id = issue_data.get("external_id")
        external_source = issue_data.get("external_source")

        # Check if issue exists
        issue = None
        issue_already_existed = False
        if external_id and external_source:
            issue = Issue.objects.filter(
                project_id=project.id,
                workspace__slug=slug,
                external_source=external_source,
                external_id=external_id,
            ).first()

        if issue:
            serializer.instance = issue
            issue_already_existed = True

        issue = serializer.save()

        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM",
                "level": "info",
                "phase": "PROCESS_ISSUES",
                "entity_name": issue.name,
                "entity_plane_id": str(issue.id),
                "entity_external_id": external_id,
                "already_exists": issue_already_existed,
                "metrics": {
                    "imported": 0 if issue_already_existed else 1,
                    "already_existed": 1 if issue_already_existed else 0,
                },
            },
            workspace_slug=slug,
        )

        # Process links
        process_issue_links(slug, issue, issue_data.get("links", []), report_id=report_id, job_id=job_id)

        # Process comments
        process_issue_comments(
            slug,
            user_id=user_id,
            issue=issue,
            comments=issue_data.get("comments", []),
            report_id=report_id,
            job_id=job_id,
        )

        # Process cycles
        process_issue_cycles(slug, issue, issue_data.get("cycles", []), report_id=report_id, job_id=job_id)

        # Process modules
        process_issue_modules(slug, issue, issue_data.get("modules", []), report_id=report_id, job_id=job_id)

        # Process file assets
        process_issue_file_assets(slug, issue, issue_data.get("file_assets", []), report_id=report_id, job_id=job_id)

        # Process issue property values
        process_issue_property_values(
            slug, issue, issue_data.get("issue_property_values", []), report_id=report_id, job_id=job_id
        )

        # Process labels
        process_issue_labels(slug, issue, labels, user_id, report_id=report_id, job_id=job_id)

        # Process activities
        if issue_data.get("activities"):
            process_issue_activities(slug, issue, issue_data.get("activities"), report_id=report_id, job_id=job_id)

        # Process worklogs
        if issue_data.get("worklogs"):
            process_issue_worklogs(slug, issue, issue_data.get("worklogs"), report_id=report_id, job_id=job_id)

        # Process subscribers
        if issue_data.get("subscribers"):
            process_issue_subscribers(slug, issue, issue_data.get("subscribers"), report_id=report_id, job_id=job_id)

        process_issue_estimates(slug, project, issue, issue_data, report_id=report_id, job_id=job_id)

        issue.save(disable_auto_set_user=True)

        # Preserve external sequence if preserve_sequence is True
        if preserve_sequence:
            preserve_external_sequence(slug, project, issue.id, issue_data)

        return issue
    except Exception as e:
        logger.error(
            "Error processing issue",
            extra={"issueId": issue_data.get("id")},
        )
        log_exception(e)
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM",
                "level": "error",
                "phase": "PROCESS_ISSUES",
                "error": {"message": str(e)},
                "additional_data": issue_data,
                "is_fatal": False,
            },
            workspace_slug=slug,
        )
        return None


def process_issue_activities(slug, issue, activities, report_id=None, job_id=None):
    if not activities:
        return

    try:
        bulk_create_activities = []
        bulk_update_activities = []
        activity_timestamp_map = {}

        existing_activities_map = {
            str(activity.external_id): activity
            for activity in IssueActivity.objects.filter(
                issue=issue,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                external_id__in=[str(a.get("external_id")) for a in activities if a.get("external_id")],
            )
        }

        for activity_data in activities:
            external_id = str(activity_data.get("external_id")) if activity_data.get("external_id") else None

            if not external_id:
                continue

            actor_id = activity_data.get("actor") or issue.created_by_id

            if external_id in existing_activities_map:
                existing_activity = existing_activities_map[external_id]
                existing_activity.verb = activity_data.get("verb", "created")
                existing_activity.field = activity_data.get("field")
                existing_activity.old_value = activity_data.get("old_value")
                existing_activity.new_value = activity_data.get("new_value")
                existing_activity.comment = activity_data.get("comment", "")
                existing_activity.actor_id = actor_id
                existing_activity.old_identifier = activity_data.get("old_identifier")
                existing_activity.new_identifier = activity_data.get("new_identifier")
                existing_activity.epoch = activity_data.get("epoch")
                existing_activity.updated_by_id = issue.created_by_id
                if activity_data.get("updated_at"):
                    existing_activity.updated_at = activity_data["updated_at"]
                elif activity_data.get("created_at"):
                    existing_activity.updated_at = activity_data["created_at"]
                bulk_update_activities.append(existing_activity)
            else:
                activity = IssueActivity(
                    issue=issue,
                    project_id=issue.project_id,
                    workspace_id=issue.workspace_id,
                    verb=activity_data.get("verb", "created"),
                    field=activity_data.get("field"),
                    old_value=activity_data.get("old_value"),
                    new_value=activity_data.get("new_value"),
                    comment=activity_data.get("comment", ""),
                    actor_id=actor_id,
                    old_identifier=activity_data.get("old_identifier"),
                    new_identifier=activity_data.get("new_identifier"),
                    epoch=activity_data.get("epoch"),
                    external_id=external_id,
                    external_source=activity_data.get("external_source"),
                    created_by_id=issue.created_by_id,
                    updated_by_id=issue.created_by_id,
                )
                bulk_create_activities.append(activity)
                activity_timestamp_map[id(activity)] = {
                    "created_at": activity_data.get("created_at"),
                    "updated_at": activity_data.get("updated_at", activity_data.get("created_at")),
                }

        created_activities = IssueActivity.objects.bulk_create(
            bulk_create_activities, batch_size=100, ignore_conflicts=True
        )

        if created_activities:
            activities_to_update_timestamps = []
            for activity in created_activities:
                timestamps = activity_timestamp_map.get(id(activity))
                if timestamps and timestamps["created_at"]:
                    activity.created_at = timestamps["created_at"]
                    activity.updated_at = timestamps["updated_at"] or timestamps["created_at"]
                    activities_to_update_timestamps.append(activity)

            collect_execution_log(
                logs=[
                    {
                        "report_id": report_id,
                        "job_id": job_id,
                        "entity_type": "WORK_ITEM_ACTIVITY",
                        "level": "info",
                        "phase": "PROCESS_ACTIVITIES",
                        "entity_plane_id": str(activity.id),
                        "entity_external_id": activity.external_id,
                        "related_entity": str(issue.external_id) if issue.external_id else None,
                        "metrics": {
                            "imported": 1,
                        },
                    }
                    for activity in created_activities
                ],
                workspace_slug=slug,
            )

            if activities_to_update_timestamps:
                IssueActivity.objects.bulk_update(
                    activities_to_update_timestamps,
                    ["created_at", "updated_at"],
                    batch_size=100,
                )

        if bulk_update_activities:
            IssueActivity.objects.bulk_update(
                bulk_update_activities,
                [
                    "verb",
                    "field",
                    "old_value",
                    "new_value",
                    "comment",
                    "actor_id",
                    "old_identifier",
                    "new_identifier",
                    "epoch",
                    "updated_by_id",
                    "updated_at",
                ],
                batch_size=100,
            )

            collect_execution_log(
                logs=[
                    {
                        "report_id": report_id,
                        "job_id": job_id,
                        "entity_type": "WORK_ITEM_ACTIVITY",
                        "level": "info",
                        "phase": "PROCESS_ACTIVITIES",
                        "entity_plane_id": str(activity.id),
                        "entity_external_id": activity.external_id,
                        "related_entity": str(issue.external_id) if issue.external_id else None,
                        "already_exists": True,
                        "metrics": {
                            "already_existed": 1,
                        },
                    }
                    for activity in bulk_update_activities
                ],
                workspace_slug=slug,
            )

    except Exception as e:
        logger.warning(f"Failed to process activities for issue {issue.id}: {str(e)}")
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_ACTIVITY",
                "level": "error",
                "phase": "PROCESS_ACTIVITIES",
                "error": {"message": str(e)},
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "is_fatal": False,
            },
            workspace_slug=slug,
        )
    return


# preserve the external sequence id for the issue if it is present in the issue data also handle duplicates if any
def preserve_external_sequence(slug, project, issue_id, issue_data):
    try:
        # check if the issue_data has external_sequence_id
        if not issue_data.get("external_sequence_id"):
            return
        with transaction.atomic():
            issue = Issue.objects.get(id=issue_id, project_id=project.id, workspace__slug=slug)
            issue.sequence_id = issue_data.get("external_sequence_id")
            issue.save(disable_auto_set_user=True)

            issue_sequence, _ = IssueSequence.objects.get_or_create(
                issue=issue, project=project, defaults={"sequence": issue.sequence_id}
            )
            if issue_sequence.sequence != issue.sequence_id:
                issue_sequence.sequence = issue.sequence_id
                issue_sequence.save(disable_auto_set_user=True)

            # Check for duplicate issues with the same sequence_id
            duplicate_issues = Issue.objects.filter(
                project_id=project.id, workspace__slug=slug, sequence_id=issue.sequence_id
            ).exclude(id=issue.id)
            if duplicate_issues.exists():
                # Use advisory lock to avoid race when assigning new sequences
                lock_key = convert_uuid_to_integer(project.id)
                with connection.cursor() as cursor:
                    cursor.execute("SELECT pg_advisory_xact_lock(%s)", [lock_key])

                last_sequence = IssueSequence.objects.filter(project=project).aggregate(largest=models.Max("sequence"))[
                    "largest"
                ]
                next_sequence = last_sequence + 1 if last_sequence else 1

                for duplicate in duplicate_issues:
                    duplicate.sequence_id = next_sequence
                    duplicate.save(disable_auto_set_user=True)

                    issue_sequence, _ = IssueSequence.objects.get_or_create(
                        issue=duplicate, project=project, defaults={"sequence": next_sequence}
                    )
                    if issue_sequence.sequence != next_sequence:
                        issue_sequence.sequence = next_sequence
                        issue_sequence.save(disable_auto_set_user=True)

                    next_sequence += 1

    except Exception as e:
        logger.warning(f"Failed to preserve external sequence for issue {issue_id}: {str(e)}")
        return None


def process_issue_worklogs(slug, issue, worklogs, report_id=None, job_id=None):
    try:
        # We need to filter out, if the same duration, logged_by and created_at is present, then update else create
        existing_worklogs = IssueWorkLog.objects.filter(
            issue=issue,
            project_id=issue.project_id,
            workspace_id=issue.workspace_id,
        )

        bulk_create_worklogs = []
        bulk_update_worklogs = []
        worklog_timestamp_map = {}  # Map to store timestamps for created worklogs

        for worklog in worklogs:
            if worklog.get("duration") and worklog.get("logged_by") and worklog.get("created_at"):
                existing_worklog = existing_worklogs.filter(
                    duration=worklog.get("duration"),
                    logged_by_id=worklog.get("logged_by"),
                    created_at=worklog.get("created_at"),
                ).first()
                if existing_worklog:
                    existing_worklog.description = worklog.get("description", "")
                    existing_worklog.duration = worklog.get("duration")
                    existing_worklog.updated_at = worklog.get("updated_at", worklog.get("created_at"))
                    existing_worklog.updated_by_id = issue.created_by_id
                    bulk_update_worklogs.append(existing_worklog)
                else:
                    new_worklog = IssueWorkLog(
                        issue=issue,
                        project_id=issue.project_id,
                        workspace_id=issue.workspace_id,
                        description=worklog.get("description", ""),
                        duration=worklog.get("duration"),
                        logged_by_id=worklog.get("logged_by"),
                        created_by_id=issue.created_by_id,
                        updated_by_id=issue.created_by_id,
                    )
                    bulk_create_worklogs.append(new_worklog)
                    # Store the timestamps to apply after creation
                    worklog_timestamp_map[id(new_worklog)] = {
                        "created_at": worklog.get("created_at"),
                        "updated_at": worklog.get("updated_at", worklog.get("created_at")),
                    }

        # Bulk create new worklogs
        created_worklogs = IssueWorkLog.objects.bulk_create(bulk_create_worklogs, batch_size=100, ignore_conflicts=True)

        # Update timestamps for newly created worklogs
        if created_worklogs:
            for worklog in created_worklogs:
                timestamps = worklog_timestamp_map.get(id(worklog))
                if timestamps:
                    worklog.created_at = timestamps["created_at"]
                    worklog.updated_at = timestamps["updated_at"]

            IssueWorkLog.objects.bulk_update(
                created_worklogs,
                ["created_at", "updated_at"],
                batch_size=100,
            )

            # Log success for created worklogs
            collect_execution_log(
                logs=[
                    {
                        "report_id": report_id,
                        "job_id": job_id,
                        "entity_type": "WORK_LOG",
                        "level": "info",
                        "phase": "PROCESS_WORKLOGS",
                        "entity_plane_id": str(worklog.id),
                        "related_entity": str(issue.external_id) if issue.external_id else None,
                        "metrics": {
                            "imported": 1,
                        },
                    }
                    for worklog in created_worklogs
                ],
                workspace_slug=slug,
            )

        # Bulk update existing worklogs
        if bulk_update_worklogs:
            IssueWorkLog.objects.bulk_update(
                bulk_update_worklogs,
                ["description", "duration", "updated_at", "updated_by_id"],
                batch_size=100,
            )

            # Log already existed worklogs
            collect_execution_log(
                logs=[
                    {
                        "report_id": report_id,
                        "job_id": job_id,
                        "entity_type": "WORK_LOG",
                        "level": "info",
                        "phase": "PROCESS_WORKLOGS",
                        "entity_plane_id": str(worklog.id),
                        "related_entity": str(issue.external_id) if issue.external_id else None,
                        "already_exists": True,
                        "metrics": {
                            "already_existed": 1,
                        },
                    }
                    for worklog in bulk_update_worklogs
                ],
                workspace_slug=slug,
            )

    except Exception as e:
        logger.warning(f"Failed to process worklogs for issue {issue.id}: {str(e)}")
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_LOG",
                "level": "error",
                "phase": "PROCESS_WORKLOGS",
                "error": {"message": str(e)},
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "is_fatal": False,
            },
            workspace_slug=slug,
        )

    return


def process_issue_links(slug, issue, links, report_id=None, job_id=None):
    try:
        bulk_create_links = []

        # Get existing links
        existing_links = list(
            IssueLink.objects.filter(
                issue=issue,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
            ).values_list("url", flat=True)
        )

        for link_data in links:
            if link_data["url"] not in existing_links:
                bulk_create_links.append(
                    IssueLink(
                        issue=issue,
                        project_id=issue.project_id,
                        workspace_id=issue.workspace_id,
                        title=link_data["name"],
                        url=link_data["url"],
                        created_by_id=issue.created_by_id,
                        updated_by_id=issue.created_by_id,
                    )
                )

        IssueLink.objects.bulk_create(bulk_create_links, batch_size=100, ignore_conflicts=True)

        # Log success summary
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_LINK",  # Explicit link type
                "level": "info",
                "phase": "PROCESS_LINKS",
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "metrics": {
                    "total": len(links),
                    "imported": len(bulk_create_links),
                },
            },
            workspace_slug=slug,
        )

    except Exception as e:
        logger.warning(f"Failed to process links for issue {issue.id}: {str(e)}")
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_LINK",
                "level": "error",
                "phase": "PROCESS_LINKS",
                "error": {"message": str(e)},
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "is_fatal": False,
            },
            workspace_slug=slug,
        )
    return


def process_issue_estimates(slug, project, issue, issue_data, report_id=None, job_id=None):
    try:
        story_points = issue_data.get("story_points")
        if story_points is None:
            return

        try:
            val = float(story_points)
            # Normalize value: "3.0" -> "3", "3.5" -> "3.5"
            normalized_value = str(int(val)) if val.is_integer() else str(val)
            # stable integer key
            stable_key = max(0, int(val))
        except (ValueError, TypeError):
            return

        # Ensure Estimate exists for the project
        estimate, created = Estimate.objects.get_or_create(
            project=project,
            name="Points",
            defaults={
                "workspace": project.workspace,
                "type": "points",
                "last_used": True,
            },
        )

        if created:
            # Update project default estimate if it's not set
            if not project.estimate:
                project.estimate = estimate
                project.save(update_fields=["estimate"])

        # Ensure EstimatePoint exists
        estimate_point, _ = EstimatePoint.objects.get_or_create(
            estimate=estimate,
            project=project,
            value=normalized_value,
            defaults={
                "workspace": project.workspace,
                "key": stable_key,
            },
        )

        # Assign estimate point to issue
        issue.estimate_point = estimate_point
        issue.save(update_fields=["estimate_point"])

        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "ESTIMATE",
                "level": "info",
                "phase": "PROCESS_ESTIMATES",
                "entity_plane_id": str(estimate_point.id),
                "related_entity": str(issue.id),
                "metrics": {
                    "imported": 1,
                },
            },
            workspace_slug=slug,
        )

    except Exception as e:
        logger.warning(f"Failed to process estimates for issue {issue.id}: {str(e)}")
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "ESTIMATE",
                "level": "error",
                "phase": "PROCESS_ESTIMATES",
                "error": {"message": str(e)},
                "related_entity": str(issue.id),
                "is_fatal": False,
            },
            workspace_slug=slug,
        )
    return


def process_issue_subscribers(slug, issue, subscriber_ids, report_id=None, job_id=None):
    """Process and assign subscribers to an issue.

    Creates IssueSubscriber records for each subscriber user ID.
    Skips subscribers that are already subscribed to the issue.

    Args:
        slug: The workspace slug
        issue: The issue instance to add subscribers to
        subscriber_ids: List of user IDs (strings) to subscribe
        report_id: The report ID for execution logging
        job_id: The job ID for execution logging
    """
    if not subscriber_ids:
        return

    try:
        # Filter out empty strings or None values
        valid_subscriber_ids = [sid for sid in subscriber_ids if sid]
        if not valid_subscriber_ids:
            return

        # Get existing subscriber IDs for this issue
        existing_subscriber_ids = set(
            IssueSubscriber.objects.filter(
                issue=issue,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                subscriber_id__in=valid_subscriber_ids,
            ).values_list("subscriber_id", flat=True)
        )

        # Build list of new subscribers to create
        existing_subscriber_set = {str(eid) for eid in existing_subscriber_ids}
        new_subscriber_ids = [sid for sid in valid_subscriber_ids if sid not in existing_subscriber_set]

        if new_subscriber_ids:
            IssueSubscriber.objects.bulk_create(
                [
                    IssueSubscriber(
                        issue=issue,
                        project_id=issue.project_id,
                        workspace_id=issue.workspace_id,
                        subscriber_id=subscriber_id,
                        created_by_id=issue.created_by_id,
                        updated_by_id=issue.created_by_id,
                    )
                    for subscriber_id in new_subscriber_ids
                ],
                batch_size=100,
                ignore_conflicts=True,
            )

        # Log success summary
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_SUBSCRIBERS",
                "level": "info",
                "phase": "PROCESS_SUBSCRIBERS",
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "metrics": {
                    "total": len(valid_subscriber_ids),
                    "imported": len(new_subscriber_ids),
                    "already_existed": len(existing_subscriber_ids),
                },
            },
            workspace_slug=slug,
        )

    except Exception as e:
        logger.warning(f"Failed to process subscribers for issue {issue.id}: {str(e)}")
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_SUBSCRIBER",
                "level": "error",
                "phase": "PROCESS_SUBSCRIBERS",
                "error": {"message": str(e)},
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "is_fatal": False,
            },
            workspace_slug=slug,
        )

    return


def process_issue_comments(slug, user_id, issue, comments, report_id=None, job_id=None):
    if not comments:
        return

    try:
        bulk_create_comments = []
        bulk_update_comments = []
        comment_timestamp_map = {}  # Map to store timestamps for created comments

        # Get existing comments for this issue only
        existing_comments_map = {
            str(comment.external_id): comment
            for comment in IssueComment.objects.filter(
                issue=issue,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                external_id__in=[str(c.get("external_id")) for c in comments if c.get("external_id")],
            )
        }

        for comment_data in comments:
            external_id = str(comment_data.get("external_id")) if comment_data.get("external_id") else None

            # Skip if no external_id
            if not external_id:
                continue

            comment_actor = comment_data.get("actor") if comment_data.get("actor") else user_id
            if external_id in existing_comments_map:
                # Update case
                existing_comment = existing_comments_map[external_id]
                existing_comment.actor_id = comment_actor
                existing_comment.created_by_id = comment_actor
                existing_comment.updated_by_id = comment_actor
                existing_comment.comment_html = comment_data["comment_html"]
                # Set updated_at if provided, otherwise use created_at or current time
                if comment_data.get("updated_at"):
                    existing_comment.updated_at = comment_data["updated_at"]
                elif comment_data.get("created_at"):
                    existing_comment.updated_at = comment_data["created_at"]
                bulk_update_comments.append(existing_comment)
            else:
                # Create case - don't set created_at/updated_at here
                comment = IssueComment(
                    issue=issue,
                    project_id=issue.project_id,
                    workspace_id=issue.workspace_id,
                    comment_html=comment_data["comment_html"],
                    actor_id=comment_actor,
                    created_by_id=comment_actor,
                    external_id=external_id,
                    external_source=comment_data.get("external_source"),
                    updated_by_id=comment_actor,
                )
                bulk_create_comments.append(comment)
                # Store the timestamps to apply after creation
                comment_timestamp_map[id(comment)] = {
                    "created_at": comment_data.get("created_at"),
                    "updated_at": comment_data.get("updated_at", comment_data.get("created_at")),
                }

        # Bulk create new comments
        created_comments = IssueComment.objects.bulk_create(bulk_create_comments, batch_size=100, ignore_conflicts=True)

        # Update timestamps for newly created comments
        if created_comments:
            comments_to_update_timestamps = []
            for comment in created_comments:
                timestamps = comment_timestamp_map.get(id(comment))
                if timestamps and timestamps["created_at"]:
                    comment.created_at = timestamps["created_at"]
                    comment.updated_at = timestamps["updated_at"] or timestamps["created_at"]
                    comments_to_update_timestamps.append(comment)

            # Log success for created comments
            collect_execution_log(
                logs=[
                    {
                        "report_id": report_id,
                        "job_id": job_id,
                        "entity_type": "WORK_ITEM_COMMENT",
                        "level": "info",
                        "phase": "PROCESS_COMMENTS",
                        "entity_plane_id": str(comment.id),
                        "entity_external_id": comment.external_id,
                        "related_entity": str(issue.external_id) if issue.external_id else None,
                        "metrics": {
                            "imported": 1,
                        },
                    }
                    for comment in created_comments
                ],
                workspace_slug=slug,
            )

            if comments_to_update_timestamps:
                IssueComment.objects.bulk_update(
                    comments_to_update_timestamps,
                    ["created_at", "updated_at"],
                    batch_size=100,
                )

        # Bulk update existing comments
        if bulk_update_comments:
            IssueComment.objects.bulk_update(
                bulk_update_comments,
                ["comment_html", "actor_id", "created_by_id", "updated_by_id", "updated_at"],
                batch_size=100,
            )

            # Log already existed comments
            collect_execution_log(
                logs=[
                    {
                        "report_id": report_id,
                        "job_id": job_id,
                        "entity_type": "WORK_ITEM_COMMENT",
                        "level": "info",
                        "phase": "PROCESS_COMMENTS",
                        "entity_plane_id": str(comment.id),
                        "entity_external_id": comment.external_id,
                        "related_entity": str(issue.external_id) if issue.external_id else None,
                        "already_exists": True,
                        "metrics": {
                            "already_existed": 1,
                        },
                    }
                    for comment in bulk_update_comments
                ],
                workspace_slug=slug,
            )

        # Process file assets for each comment - ensure comments is not None
        if comments and created_comments:
            for comment in created_comments:
                comment_data = next(
                    (c for c in comments if str(c.get("external_id")) == str(comment.external_id)),
                    None,
                )
                if comment_data and comment_data.get("file_assets"):
                    process_comment_file_assets(
                        slug, comment, comment_data["file_assets"], report_id=report_id, job_id=job_id
                    )

        if comments and bulk_update_comments:
            for comment in bulk_update_comments:
                comment_data = next(
                    (c for c in comments if str(c.get("external_id")) == str(comment.external_id)),
                    None,
                )
                if comment_data and comment_data.get("file_assets"):
                    process_comment_file_assets(
                        slug, comment, comment_data["file_assets"], report_id=report_id, job_id=job_id
                    )
    except Exception as e:
        logger.warning(f"Failed to process comments for issue {issue.id}: {str(e)}")
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_COMMENT",
                "level": "error",
                "phase": "PROCESS_COMMENTS",
                "error": {"message": str(e)},
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "is_fatal": False,
            },
            workspace_slug=slug,
        )

    return


def process_issue_cycles(slug, issue, cycle_ids, report_id=None, job_id=None):
    try:
        logs_to_create = []
        CycleIssue.objects.filter(
            issue=issue,
            workspace_id=issue.workspace_id,
            project_id=issue.project_id,
        ).delete()
        for cycle_id in cycle_ids:
            cycle_issue, created = CycleIssue.objects.get_or_create(
                issue=issue,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                cycle_id=cycle_id,
                defaults={
                    "created_by_id": issue.created_by_id,
                    "updated_by_id": issue.created_by_id,
                },
            )

            # Log individual cycle association
            logs_to_create.append(
                {
                    "report_id": report_id,
                    "job_id": job_id,
                    "entity_type": "WORK_ITEM_CYCLE",
                    "level": "info",
                    "phase": "PROCESS_CYCLES",
                    "entity_plane_id": str(cycle_issue.id),
                    "related_entity": str(issue.external_id) if issue.external_id else None,
                    "already_exists": not created,
                    "metrics": {
                        "imported": 1 if created else 0,
                        "already_existed": 0 if created else 1,
                    },
                }
            )

        collect_execution_log(
            logs=logs_to_create,
            workspace_slug=slug,
        )

    except Exception as e:
        logger.warning(f"Failed to process cycles for issue {issue.id}: {str(e)}")
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_CYCLE",
                "level": "error",
                "phase": "PROCESS_CYCLES",
                "error": {"message": str(e)},
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "is_fatal": False,
            },
            workspace_slug=slug,
        )
    return


def process_issue_labels(slug, issue, labels, user_id, report_id=None, job_id=None):
    """
    Process and assign labels to an issue.
    Creates labels if they don't exist and assigns them to the issue.

    Args:
        issue: The issue instance to assign labels to
        labels: List of label names (strings)
        user_id: The user ID for created_by and updated_by fields
        report_id: The report ID for execution logging
    """
    if not labels:
        return

    try:
        # Get existing label names for this project
        existing_label_names = set(
            Label.objects.filter(
                name__in=labels,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
            ).values_list("name", flat=True)
        )

        # Identify labels that need to be created
        labels_to_create = [name for name in labels if name not in existing_label_names]

        # Bulk create missing labels (ignore_conflicts handles duplicates)
        # Note: With ignore_conflicts=True, returned objects may have phantom UUIDs
        # that were never actually saved (Django generates UUIDs before INSERT)
        if labels_to_create:
            Label.objects.bulk_create(
                [
                    Label(
                        name=label_name,
                        project_id=issue.project_id,
                        workspace_id=issue.workspace_id,
                        color=f"#{random.randint(0, 0xFFFFFF):06X}",
                    )
                    for label_name in labels_to_create
                ],
                ignore_conflicts=True,
            )

        # Re-query to get actual label IDs (handles both race conditions and
        # phantom UUIDs from bulk_create with ignore_conflicts)
        valid_label_ids = list(
            Label.objects.filter(
                name__in=labels,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
            ).values_list("id", flat=True)
        )

        # Create new IssueLabel associations
        if valid_label_ids:
            IssueLabel.objects.bulk_create(
                [
                    IssueLabel(
                        workspace_id=issue.workspace_id,
                        project_id=issue.project_id,
                        issue=issue,
                        label_id=label_id,
                        created_by_id=user_id,
                        updated_by_id=user_id,
                    )
                    for label_id in valid_label_ids
                ],
                batch_size=10,
                ignore_conflicts=True,
            )

            # Log success summary
            collect_execution_log(
                logs={
                    "report_id": report_id,
                    "job_id": job_id,
                    "entity_type": "WORK_ITEM_LABEL",
                    "level": "info",
                    "phase": "PROCESS_LABELS",
                    "related_entity": str(issue.external_id) if issue.external_id else None,
                    "metrics": {"total": len(labels), "imported": len(valid_label_ids), "labels": labels},
                },
                workspace_slug=slug,
            )

    except Exception as e:
        # Log but don't crash - label failures shouldn't block the entire import
        logger.warning(
            f"Failed to process labels for issue {issue.id}: {str(e)}",
            extra={"issue_id": str(issue.id), "labels": labels},
        )
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_LABEL",
                "level": "error",
                "phase": "PROCESS_LABELS",
                "error": {"message": str(e)},
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "additional_data": {"labels": labels},
                "is_fatal": False,
            },
            workspace_slug=slug,
        )

    return


def process_issue_modules(slug, issue, module_ids, report_id=None, job_id=None):
    try:
        logs_to_create = []
        # Create new module associations without deleting existing ones
        for module_id in module_ids:
            module_issue, created = ModuleIssue.objects.get_or_create(
                issue=issue,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                module_id=module_id,
                defaults={
                    "created_by_id": issue.created_by_id,
                    "updated_by_id": issue.created_by_id,
                },
            )

            # Log individual module association
            logs_to_create.append(
                {
                    "report_id": report_id,
                    "job_id": job_id,
                    "entity_type": "WORK_ITEM_MODULE",
                    "level": "info",
                    "phase": "PROCESS_MODULES",
                    "entity_plane_id": str(module_issue.id),
                    "related_entity": str(issue.external_id) if issue.external_id else None,
                    "already_exists": not created,
                    "metrics": {
                        "imported": 1 if created else 0,
                        "already_existed": 0 if created else 1,
                    },
                }
            )

        collect_execution_log(
            logs=logs_to_create,
            workspace_slug=slug,
        )

    except Exception as e:
        logger.warning(f"Failed to process modules for issue {issue.id}: {str(e)}")
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_MODULE",
                "level": "error",
                "phase": "PROCESS_MODULES",
                "error": {"message": str(e)},
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "is_fatal": False,
            },
            workspace_slug=slug,
        )
    return


def process_comment_file_assets(slug, comment, file_assets, report_id=None, job_id=None):
    if not file_assets:
        return

    try:
        # Get all assets by their IDs
        asset_ids = [asset_id for asset_id in file_assets if asset_id]
        if not asset_ids:
            return

        # Bulk update all assets
        FileAsset.objects.filter(id__in=asset_ids).update(
            entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
            comment_id=comment.id,
            project_id=comment.project_id,
            workspace_id=comment.workspace_id,
            created_by_id=comment.created_by_id,
            updated_by_id=comment.updated_by_id,
        )

        # Log success summary
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_COMMENT_FILE_ASSET",
                "level": "info",
                "phase": "PROCESS_COMMENT_FILE_ASSETS",
                "related_entity": str(comment.external_id) if comment.external_id else None,
                "metrics": {
                    "total": len(file_assets),
                    "imported": len(asset_ids),
                },
            },
            workspace_slug=slug,
        )

    except Exception as e:
        logger.warning(f"Failed to process comment file assets for comment {comment.id}: {str(e)}")
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_COMMENT_FILE_ASSET",
                "level": "error",
                "phase": "PROCESS_COMMENT_FILE_ASSETS",
                "error": {"message": str(e)},
                "related_entity": str(comment.external_id) if comment.external_id else None,
                "is_fatal": False,
            },
            workspace_slug=slug,
        )
    return


def process_issue_file_assets(slug, issue, file_assets, report_id=None, job_id=None):
    if not file_assets:
        return

    try:
        # Get all assets by their IDs
        asset_ids = [asset_id for asset_id in file_assets if asset_id]
        if not asset_ids:
            return

        # Bulk update all assets
        FileAsset.objects.filter(id__in=asset_ids).update(
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            issue_id=issue.id,
            project_id=issue.project_id,
            workspace_id=issue.workspace_id,
            created_by_id=issue.created_by_id,
            updated_by_id=issue.created_by_id,
        )

        # Log success summary
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_FILE_ASSET",  # Or generic WORK_ITEM
                "level": "info",
                "phase": "PROCESS_FILE_ASSETS",
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "metrics": {
                    "total": len(file_assets),
                    "imported": len(asset_ids),
                },
            },
            workspace_slug=slug,
        )

    except Exception as e:
        logger.warning(f"Failed to process file assets for issue {issue.id}: {str(e)}")
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "WORK_ITEM_FILE_ASSET",
                "level": "error",
                "phase": "PROCESS_FILE_ASSETS",
                "error": {"message": str(e)},
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "is_fatal": False,
            },
            workspace_slug=slug,
        )
    return


def process_issue_property_values(slug, issue, issue_property_values, report_id=None, job_id=None):
    try:
        workspace = Workspace.objects.get(pk=issue.workspace_id)
        saved_count = 0

        for property_data in issue_property_values:
            property_id = property_data.get("id")
            if not property_id:
                continue

            issue_property = IssueProperty.objects.get(pk=property_id)

            # existing issue property values
            existing_issue_property_values = IssuePropertyValue.objects.filter(
                workspace__slug=workspace.slug,
                project_id=issue.project_id,
                issue_id=issue.id,
                property_id=property_id,
                property__issue_type_properties__issue_type__is_epic=False,
            )

            issue_property_values_data = property_data.get("values", [])

            if not issue_property_values_data:
                continue

            # validate the property value
            bulk_external_issue_property_values = []
            for value in issue_property_values_data:
                # check if ant external id and external source is provided
                property_value = value.get("value", None)

                if property_value:
                    try:
                        externalIssuePropertyValueValidator(issue_property=issue_property, value=property_value)
                    except Exception as e:
                        collect_execution_log(
                            logs={
                                "report_id": report_id,
                                "job_id": job_id,
                                "entity_type": "ISSUE_PROPERTY_VALUE",
                                "level": "error",
                                "phase": "PROCESS_PROPERTY_VALUES",
                                "error": {"message": f"Validation failed for property {property_id}: {str(e)}"},
                                "related_entity": str(issue.external_id) if issue.external_id else None,
                                "additional_data": {"property_id": property_id, "value": property_value},
                                "is_fatal": False,
                            },
                            workspace_slug=slug,
                        )
                        continue

                    # check if issue property with the same external id and external source already exists
                    property_external_id = value.get("external_id", None)
                    property_external_source = value.get("external_source", None)

                    if property_value in ["true", "false"]:
                        property_value = get_boolean_value(property_value)

                    # Save the values
                    bulk_external_issue_property_values.append(
                        externalIssuePropertyValueSaver(
                            workspace_id=issue.workspace.id,
                            project_id=issue.project_id,
                            issue_id=issue.id,
                            issue_property=issue_property,
                            value=property_value,
                            external_id=property_external_id,
                            external_source=property_external_source,
                        )
                    )

            if bulk_external_issue_property_values:
                #  remove the existing issue property values
                existing_issue_property_values.delete()

                # Bulk create the issue property values
                IssuePropertyValue.objects.bulk_create(bulk_external_issue_property_values, batch_size=10)
                saved_count += len(bulk_external_issue_property_values)

        # Log success summary
        if saved_count > 0:
            collect_execution_log(
                logs={
                    "report_id": report_id,
                    "job_id": job_id,
                    "entity_type": "ISSUE_PROPERTY_VALUE",
                    "level": "info",
                    "phase": "PROCESS_PROPERTY_VALUES",
                    "related_entity": str(issue.external_id) if issue.external_id else None,
                    "metrics": {
                        "total": len(issue_property_values),
                        "imported": saved_count,
                    },
                },
                workspace_slug=slug,
            )

    except Exception as e:
        logger.warning(f"Failed to process property values for issue {issue.id}: {str(e)}")
        collect_execution_log(
            logs={
                "report_id": report_id,
                "job_id": job_id,
                "entity_type": "ISSUE_PROPERTY_VALUE",
                "level": "error",
                "phase": "PROCESS_PROPERTY_VALUES",
                "error": {"message": str(e)},
                "related_entity": str(issue.external_id) if issue.external_id else None,
                "is_fatal": False,
            },
            workspace_slug=slug,
        )


def process_issues(slug, project, user_id, issue_list, report_id=None, job_id=None, preserve_sequence=False):
    """
    Process issues for import
    Args:
        slug (str): Workspace slug
        project (Project): Project object
        user_id (str): User ID
        issue_list (list): List of issue data dictionaries
        report_id (str): Report ID for execution log collection
    Returns:
        tuple: (imported_issues_count, total_issues_count, external_id_map)
    """
    external_id_map = {}
    total_issues = len(issue_list)
    imported_issues = 0

    if not issue_list:
        return imported_issues, total_issues, external_id_map

    # First pass: Create/Update parent issues
    processed_issues = []
    for issue_data in issue_list:
        try:
            if issue_data.get("parent") is None:
                issue = process_single_issue(
                    slug,
                    project,
                    user_id,
                    issue_data,
                    report_id=report_id,
                    job_id=job_id,
                    preserve_sequence=preserve_sequence,
                )
                if issue:
                    imported_issues += 1
                    processed_issues.append((issue.id, issue_data))
                    if issue_data.get("external_id"):
                        external_id_map[issue_data["external_id"]] = str(issue.id)
        except Exception as e:
            logger.warning(f"Failed to process parent issue: {str(e)}")

    # Second pass: Create/Update child issues
    for issue_data in issue_list:
        try:
            if issue_data.get("parent") is not None:
                parent_external_id = issue_data["parent"]
                if parent_external_id in external_id_map:
                    issue_data["parent"] = external_id_map[parent_external_id]
                else:
                    parent_issue = Issue.objects.filter(
                        project_id=project.id,
                        workspace__slug=slug,
                        external_id=parent_external_id,
                        external_source=issue_data.get("external_source"),
                    ).first()
                    issue_data["parent"] = str(parent_issue.id) if parent_issue else None

                issue = process_single_issue(
                    slug,
                    project,
                    user_id,
                    issue_data,
                    report_id=report_id,
                    job_id=job_id,
                    preserve_sequence=preserve_sequence,
                )
                if issue:
                    imported_issues += 1
                    processed_issues.append((issue.id, issue_data))
                    if issue_data.get("external_id"):
                        external_id_map[issue_data["external_id"]] = str(issue.id)
        except Exception as e:
            logger.warning(f"Failed to process child issue: {str(e)}")

    # Final pass: Batch update timestamps and authors for all processed issues
    # We use .update() to bypass custom save signals and auto_now/auto_now_add fields.
    # Group issues by their unique field-value combination so we can issue a single
    # UPDATE … WHERE id IN (…) per group instead of one query per issue.
    update_groups: dict[str, dict] = {}  # signature -> {"ids": [...], "fields": {...}}
    for issue_id, issue_data in processed_issues:
        update_fields = {}
        if issue_data.get("created_at"):
            update_fields["created_at"] = issue_data["created_at"]
        if issue_data.get("updated_at"):
            update_fields["updated_at"] = issue_data["updated_at"]
            update_fields["last_activity_at"] = issue_data["updated_at"]
        if issue_data.get("created_by"):
            update_fields["created_by_id"] = issue_data["created_by"]
            update_fields["updated_by_id"] = issue_data["created_by"]

        if not update_fields:
            continue

        # Build a hashable signature from the sorted field items
        signature = str(sorted(update_fields.items()))
        if signature not in update_groups:
            update_groups[signature] = {"ids": [], "fields": update_fields}
        update_groups[signature]["ids"].append(issue_id)

    for group in update_groups.values():
        Issue.objects.filter(id__in=group["ids"]).update(**group["fields"])

    return imported_issues, total_issues, external_id_map


def process_pages(slug, project_id, user_id, page_list):
    """
    Process pages for import with bulk operations
    Args:
        slug (str): Workspace slug
        project_id (str): Project ID
        user_id (str): User ID
        page_list (list): List of page data dictionaries
    Returns:
        tuple: (imported_pages_count, total_pages_count)
    """
    total_pages = len(page_list)
    imported_pages = 0

    if not page_list:
        return imported_pages, total_pages

    # Get workspace id from slug
    workspace = Workspace.objects.get(slug=slug)

    # Pages to create vs update
    pages_to_create = []
    pages_to_update = []

    # First, identify existing pages by external id
    external_ids_map = {
        (p.get("external_id"), p.get("external_source")): p
        for p in page_list
        if p.get("external_id") and p.get("external_source")
    }

    # Get all existing pages in one query
    if external_ids_map:
        existing_pages = Page.objects.filter(
            workspace__id=workspace.id,
            project_pages__project_id=project_id,
            project_pages__deleted_at__isnull=True,
            external_id__in=[key[0] for key in external_ids_map.keys()],
            external_source__in=list(set(key[1] for key in external_ids_map.keys())),
        )

        # Create lookup map for existing pages
        existing_pages_map = {(page.external_id, page.external_source): page for page in existing_pages}
    else:
        existing_pages_map = {}

    # Process each page for bulk operations
    try:
        with transaction.atomic():
            # Handle updates first
            for key, page_data in external_ids_map.items():
                if key in existing_pages_map:
                    # Update case
                    page = existing_pages_map[key]
                    for field, value in page_data.items():
                        # Skip fields that shouldn't be directly updated
                        if field in [
                            "id",
                            "created_at",
                            "updated_at",
                            "created_by",
                            "projects",
                        ]:
                            continue
                        setattr(page, field, value)
                    pages_to_update.append(page)
                else:
                    # New pages to create
                    new_page = Page(
                        workspace_id=workspace.id,
                        name=page_data.get("name", "Untitled Page"),
                        external_id=page_data.get("external_id"),
                        external_source=page_data.get("external_source"),
                        description=page_data.get("description", {}),
                        description_html=page_data.get("description_html", "<p></p>"),
                        description_binary=page_data.get("description_binary"),
                        owned_by_id=user_id,
                        created_by_id=user_id,
                        updated_by_id=user_id,
                    )
                    pages_to_create.append(new_page)

            # For pages without external ids
            for page_data in [p for p in page_list if not (p.get("external_id") and p.get("external_source"))]:
                new_page = Page(
                    workspace_id=workspace.id,
                    name=page_data.get("name", "Untitled Page"),
                    external_id=page_data.get("external_id"),
                    external_source=page_data.get("external_source"),
                    description=page_data.get("description", {}),
                    description_html=page_data.get("description_html", "<p></p>"),
                    description_binary=page_data.get("description_binary"),
                    owned_by_id=user_id,
                    created_by_id=user_id,
                    updated_by_id=user_id,
                )
                pages_to_create.append(new_page)

            # Bulk update existing pages
            if pages_to_update:
                fields_to_update = [
                    "name",
                    "description",
                    "description_html",
                    "description_binary",
                    "owned_by_id",
                    "updated_by_id",
                ]
                Page.objects.bulk_update(pages_to_update, fields_to_update, batch_size=100)
                imported_pages += len(pages_to_update)

            # Bulk create new pages
            if pages_to_create:
                created_pages = Page.objects.bulk_create(pages_to_create, batch_size=100)
                imported_pages += len(created_pages)

                ProjectPage.objects.bulk_create(
                    [
                        ProjectPage(page=page, project_id=project_id, workspace_id=workspace.id)
                        for page in created_pages
                    ],
                    batch_size=1000,
                )
    except Exception as e:
        logger.warning(f"Failed to process pages for project {project_id}: {str(e)}")

    return imported_pages, total_pages


@shared_task
def import_data(slug, project_id, user_id, job_id, payload):
    """
    Import issues and pages into a project
    Args:
        slug (str): Workspace slug
        project_id (str): Project ID
        user_id (str): User ID
        job_id (str): Job ID for tracking batch completion
        payload (dict): Dictionary containing lists of 'issues' and 'pages'.
    """
    try:
        from plane.ee.models import ImportJob

        # Get the job and its report ID
        try:
            job = ImportJob.objects.select_related("report").get(pk=job_id)
            report_id = job.report.id if job.report else None
        except ImportJob.DoesNotExist:
            report_id = None
            logger.warning(f"Job not found with id {job_id}, proceeding without execution logging")

        project = Project.objects.get(pk=project_id)
        imported_issues = 0
        total_issues = 0
        imported_pages = 0
        total_pages = 0

        # Process issues
        issue_list = payload.get("issues")
        job_phase = payload.get("phase", "issues")
        is_last_batch = payload.get("isLastBatch", False)
        preserve_sequence = payload.get("preserveSequence", False)

        logger.info(
            "inside import_data task",
            extra={
                "jobId": job_id,
                "phase": job_phase,
                "issueCount": len(issue_list or []),
                "lastBatchData": is_last_batch,
            },
        )

        if issue_list:
            imported_issues, total_issues, external_id_map = process_issues(
                slug,
                project,
                user_id,
                issue_list,
                report_id=report_id,
                job_id=job_id,
                preserve_sequence=preserve_sequence,
            )
            update_job_batch_completion(job_id, 1, total_issues, imported_issues, job_phase, is_last_batch)

        # Handle edge-case where a batch contains no issues.
        # Without this, completed_batch_count never increments for such batches,
        # leaving the job in an endless "TRANSFORMING" state.
        if not issue_list:
            update_job_batch_completion(job_id, 0, 0, 0, job_phase, is_last_batch)

        # Process pages
        page_list = payload.get("pages")
        if page_list:
            imported_pages, total_pages = process_pages(slug, project_id, user_id, page_list)
            update_job_batch_completion(job_id, 1, total_pages, imported_pages, "pages", is_last_batch)

        if not page_list:
            update_job_batch_completion(job_id, 0, 0, 0, "pages", is_last_batch)

        logger.info(f"Processed {imported_issues}/{total_issues} issues and {imported_pages}/{total_pages} pages.")
        return True
    except Exception as e:
        # Assuming there's error handling in the calling code
        logger.error(
            "Error in import_data",
            extra={"jobId": job_id, "phase": job_phase, "isLastBatch": is_last_batch},
        )
        log_exception(e)
        # increase the error batch count and completed batch count
        from plane.ee.models import ImportJob
        from django.db.models import F

        job = ImportJob.objects.get(pk=job_id)
        if job.report:
            job.report.__class__.objects.filter(id=job.report.id).update(
                errored_batch_count=F("errored_batch_count") + 1,
                completed_batch_count=F("completed_batch_count") + 1,
            )

            # Safely fetch phase and last-batch flag from the original payload;
            # they may not be in scope if the error occurred before variables were set.
            safe_job_phase = payload.get("phase", "issues")
            safe_is_last_batch = payload.get("isLastBatch", False)

            dispatch_job_completion(job_id, safe_job_phase, safe_is_last_batch)

        return False
