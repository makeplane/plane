# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Writing ActivityEvent rows. Work item actions are copied from IssueActivity (the history Plane keeps
# anyway) by a periodic task; pages, cycles, modules and views have no history table, so signals record
# them as they happen (signals.py).

# Python imports
from datetime import timedelta

# Django imports
from django.utils import timezone

# Module imports
from plane.liviere.activity.kinds import PAGE_ARCHIVE, PAGE_EDITED, kind_for_issue_activity

# IssueActivity rows are written by a Celery task, so they may land a bit after the sync that should
# have seen them; every sync looks this far back and skips what it already copied.
SYNC_OVERLAP = timedelta(minutes=10)
SYNC_CHUNK = 2000
# The live server stores an open page every ~10 s; count at most one content edit per person and page
# in this window.
PAGE_EDIT_WINDOW = timedelta(seconds=60)


def sync_issue_activity(issue_activity_model, event_model, since=None):
    """
    Copies IssueActivity rows changed after `since` (default: the last copied row minus SYNC_OVERLAP,
    everything when nothing was copied yet) into events. Idempotent. Takes the model classes so the data
    migration can pass its historical models. Returns the number of rows looked at.
    """
    source = "issue_activity"  # ActivityEvent.SOURCE_ISSUE_ACTIVITY; historical models lack the constant
    if since is None:
        copied = event_model.objects.filter(source=source).order_by("-created_at")
        last = copied.values_list("created_at", flat=True).first()
        since = last - SYNC_OVERLAP if last else None

    rows = issue_activity_model.objects.filter(deleted_at__isnull=True, project_id__isnull=False)
    if since is not None:
        rows = rows.filter(updated_at__gte=since)
    rows = rows.values_list("id", "workspace_id", "project_id", "issue_id", "actor_id", "field", "verb", "created_at")

    seen = 0
    batch = []
    for row_id, workspace_id, project_id, issue_id, actor_id, field, verb, created_at in rows.iterator(
        chunk_size=SYNC_CHUNK
    ):
        seen += 1
        kind = kind_for_issue_activity(field, verb)
        if kind is None:
            continue
        batch.append(
            event_model(
                workspace_id=workspace_id,
                project_id=project_id,
                actor_id=actor_id,
                occurred_at=created_at,
                kind=kind,
                source=source,
                source_id=row_id,
                issue_id=issue_id,
            )
        )
        if len(batch) >= SYNC_CHUNK:
            event_model.objects.bulk_create(batch, ignore_conflicts=True)
            batch = []
    if batch:
        event_model.objects.bulk_create(batch, ignore_conflicts=True)
    return seen


def record_page_event(page_id, kind, actor_id, project_ids=None):
    """Records a page action for every project the page belongs to."""
    from plane.db.models import ProjectPage
    from plane.liviere.models import ActivityEvent

    now = timezone.now()
    if (
        kind == PAGE_EDITED
        and ActivityEvent.objects.filter(
            page_id=page_id, actor_id=actor_id, kind=PAGE_EDITED, occurred_at__gte=now - PAGE_EDIT_WINDOW
        ).exists()
    ):
        return

    project_pages = ProjectPage.objects.filter(page_id=page_id, deleted_at__isnull=True)
    if project_ids is not None:
        project_pages = project_pages.filter(project_id__in=project_ids)
    ActivityEvent.objects.bulk_create(
        [
            ActivityEvent(
                workspace_id=workspace_id,
                project_id=project_id,
                actor_id=actor_id,
                occurred_at=now,
                kind=kind,
                source=ActivityEvent.SOURCE_PAGE,
                page_id=page_id,
            )
            for workspace_id, project_id in project_pages.values_list("workspace_id", "project_id")
        ]
    )


def record_page_archive(page_id, actor):
    """Hook for the archive and unarchive endpoints: they update pages with raw SQL, which no signal sees."""
    from plane.utils.exception_logger import log_exception

    try:
        if actor is not None and not actor.is_anonymous:
            record_page_event(page_id, PAGE_ARCHIVE, actor.id)
    except Exception as e:  # never break the request because of the heatmap
        log_exception(e)
