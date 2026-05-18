# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Celery task: copy a project to another workspace."""

import uuid

from celery import shared_task
from django.db import transaction

from plane.db.models import (
    Issue,
    Project,
    ProjectCopyJob,
    ProjectIdentifier,
)
from plane.utils.exception_logger import log_exception
from plane.bgtasks.copy_project_helpers import (
    BATCH,
    copy_cycles,
    copy_estimates,
    copy_labels,
    copy_modules,
    copy_states,
)
from plane.bgtasks.copy_project_issue_helpers import (
    copy_cycle_issues,
    copy_issue_assignees,
    copy_issue_attachments,
    copy_issue_comments,
    copy_issue_labels,
    copy_module_issues,
    copy_project_members,
    copy_worklogs,
)


def _build_new_identifier(name: str, workspace_id) -> str:
    """Generate a unique identifier for the new project in the target workspace."""
    base = "".join(ch for ch in name.upper() if ch.isalpha())[:6] or "PROJ"
    candidate = base
    suffix = 1
    while ProjectIdentifier.objects.filter(
        name=candidate, workspace_id=workspace_id, deleted_at__isnull=True
    ).exists():
        candidate = f"{base}{suffix}"
        suffix += 1
    return candidate


def _copy_issues(source_project, new_project, state_id_map, estimate_point_id_map):
    """
    Two-pass issue copy:
      Pass 1 — create issues (parent=None), build issue_id_map.
      Pass 2 — wire parent FK using issue_id_map.
    Returns issue_id_map.
    """
    source_issues = list(
        Issue.issue_objects.filter(project=source_project)
        .only(
            "id", "name", "description_html", "description_json",
            "description_stripped", "priority", "start_date", "target_date",
            "state_id", "estimate_point_id", "parent_id",
            "sort_order", "is_draft", "sequence_id",
            "frequency", "main_task_category_id", "sub_task_category_id",
        )
    )

    issue_id_map = {}
    new_issues = []
    for iss in source_issues:
        new_id = uuid.uuid4()
        issue_id_map[iss.id] = new_id
        new_issues.append(
            Issue(
                id=new_id,
                name=iss.name,
                description_html=iss.description_html,
                description_json=iss.description_json,
                description_stripped=iss.description_stripped,
                priority=iss.priority,
                start_date=iss.start_date,
                target_date=iss.target_date,
                state_id=state_id_map.get(iss.state_id),
                estimate_point_id=estimate_point_id_map.get(iss.estimate_point_id),
                sort_order=iss.sort_order,
                is_draft=iss.is_draft,
                frequency=iss.frequency,
                main_task_category_id=iss.main_task_category_id,
                sub_task_category_id=iss.sub_task_category_id,
                parent=None,  # wire in pass 2
                project=new_project,
                workspace=new_project.workspace,
            )
        )

    # Pass 1: bulk insert without parents
    for i in range(0, len(new_issues), BATCH):
        Issue.objects.bulk_create(new_issues[i : i + BATCH])

    # Pass 2: update parent FK
    issues_with_parents = [iss for iss in source_issues if iss.parent_id]
    updated = []
    for iss in issues_with_parents:
        new_id = issue_id_map[iss.id]
        new_parent_id = issue_id_map.get(iss.parent_id)
        if new_parent_id:
            updated.append(Issue(id=new_id, parent_id=new_parent_id))

    for i in range(0, len(updated), BATCH):
        Issue.objects.bulk_update(updated[i : i + BATCH], ["parent_id"], batch_size=BATCH)

    return issue_id_map


@shared_task(soft_time_limit=600)
def copy_project_task(job_id: str) -> None:
    """Copy a project (and all sub-entities) to a target workspace."""
    try:
        job = ProjectCopyJob.objects.select_related(
            "source_project", "source_workspace", "target_workspace", "initiated_by"
        ).get(id=job_id)
    except ProjectCopyJob.DoesNotExist:
        return

    job.status = ProjectCopyJob.Status.PROCESSING
    job.save(update_fields=["status"])

    try:
        # DB transaction — all relational entities copied atomically.
        # S3 attachment copies run AFTER commit to avoid orphaned files on rollback.
        with transaction.atomic():
            source = job.source_project
            target_ws = job.target_workspace
            actor = job.initiated_by

            # --- New project ---
            new_identifier = job.identifier or _build_new_identifier(source.name, target_ws.id)
            new_name = job.name_override or source.name
            new_project = Project(
                id=uuid.uuid4(),
                name=new_name,
                description=source.description,
                description_text=source.description_text,
                description_html=source.description_html,
                network=source.network,
                workspace=target_ws,
                identifier=new_identifier,
                emoji=source.emoji,
                icon_prop=source.icon_prop,
                module_view=source.module_view,
                cycle_view=source.cycle_view,
                issue_views_view=source.issue_views_view,
                page_view=source.page_view,
                intake_view=source.intake_view,
                is_time_tracking_enabled=source.is_time_tracking_enabled,
                logo_props=source.logo_props,
                timezone=source.timezone,
            )
            new_project.save(disable_auto_set_user=True)

            ProjectIdentifier.objects.create(
                workspace=target_ws,
                project=new_project,
                name=new_identifier,
            )

            # --- Sub-entities ---
            estimate_id_map, estimate_point_id_map = copy_estimates(source, new_project)
            state_id_map = copy_states(source, new_project)
            label_id_map = copy_labels(source, new_project)
            module_id_map = copy_modules(source, new_project)
            cycle_id_map = copy_cycles(source, new_project, fallback_user=actor)

            # --- Issues (two-pass) ---
            issue_id_map = _copy_issues(source, new_project, state_id_map, estimate_point_id_map)

            # --- Issue relations ---
            copy_issue_labels(source, new_project, issue_id_map, label_id_map)
            copy_issue_assignees(source, new_project, issue_id_map)
            copy_module_issues(source, new_project, module_id_map, issue_id_map)
            copy_cycle_issues(source, new_project, cycle_id_map, issue_id_map)

            # --- Comments, worklogs (no S3) ---
            copy_issue_comments(source, new_project, issue_id_map)
            copy_worklogs(source, new_project, issue_id_map)

            # --- Members ---
            copy_project_members(source, new_project)

        # S3 copies run outside the DB transaction.
        # Failures are logged but do not roll back the project copy.
        copy_issue_attachments(source, new_project, issue_id_map)

        # --- Complete ---
        job.status = ProjectCopyJob.Status.COMPLETED
        job.new_project_id = new_project.id
        job.save(update_fields=["status", "new_project_id"])

    except Exception as exc:
        job.status = ProjectCopyJob.Status.FAILED
        job.error = "Project copy failed due to an internal error. Please try again."
        job.save(update_fields=["status", "error"])
        log_exception(exc)
        raise
