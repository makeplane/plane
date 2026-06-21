# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from plane.db.models import WorkspaceSprint, WorkspaceSprintAutomation


def _format_sprint_name(template, sequence, start_date, end_date):
    return (
        template.replace("{{number}}", str(sequence))
        .replace("{{start}}", start_date.strftime("%b %d"))
        .replace("{{end}}", end_date.strftime("%b %d"))
    )


def _window_for(automation, now):
    start_date = automation.start_date
    if now < start_date:
        return start_date

    elapsed_days = (now.date() - start_date.date()).days
    window_offset = elapsed_days // automation.sprint_duration_days
    return start_date + timedelta(days=window_offset * automation.sprint_duration_days)


def _ensure_sprint_for_window(automation, start_date, sequence):
    end_date = start_date + timedelta(days=automation.sprint_duration_days) - timedelta(seconds=1)
    sprint = WorkspaceSprint.objects.filter(
        workspace=automation.workspace,
        automation=automation,
        start_date=start_date,
        end_date=end_date,
        deleted_at__isnull=True,
    ).first()

    if sprint:
        return sprint, False

    sprint = WorkspaceSprint.objects.create(
        workspace=automation.workspace,
        automation=automation,
        name=_format_sprint_name(automation.name_template, sequence, start_date, end_date),
        description=automation.description,
        start_date=start_date,
        end_date=end_date,
        owned_by=automation.created_by or automation.workspace.owner,
        source="automation",
        sequence_id=sequence,
        timezone=automation.timezone,
    )
    return sprint, True


def process_workspace_sprint_automation(automation):
    if not automation.enabled:
        return []

    created = []
    now = timezone.now()
    current_start = _window_for(automation, now)

    with transaction.atomic():
        for index, start_date in enumerate(
            [
                current_start,
                current_start + timedelta(days=automation.sprint_duration_days),
            ]
        ):
            sequence = automation.next_sequence + index
            sprint, was_created = _ensure_sprint_for_window(automation, start_date, sequence)
            if was_created:
                created.append(sprint.id)

        if created:
            automation.next_sequence = automation.next_sequence + len(created)
            automation.save(update_fields=["next_sequence", "updated_at"])

    return created


process_workspace_sprint_squad = process_workspace_sprint_automation


@shared_task
def process_workspace_sprint_automations():
    automation_ids = WorkspaceSprintAutomation.objects.filter(enabled=True).values_list("id", flat=True)
    for automation_id in automation_ids:
        automation = WorkspaceSprintAutomation.objects.select_related("workspace", "workspace__owner", "created_by").get(
            id=automation_id
        )
        process_workspace_sprint_automation(automation)
