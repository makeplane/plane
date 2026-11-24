# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Models of the Liviere/plane fork. They live in their own Django app (label "liviere") with its own
# migrations, so they never clash with upstream migrations in plane/db.

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from plane.liviere.activity.kinds import DEFAULT_KINDS


def default_activity_kinds():
    return list(DEFAULT_KINDS)


class ActivityEvent(models.Model):
    """One action in a project, counted by the activity heatmap (plane/liviere/activity)."""

    SOURCE_ISSUE_ACTIVITY = "issue_activity"
    SOURCE_PAGE = "page"
    SOURCE_CYCLE = "cycle"
    SOURCE_MODULE = "module"
    SOURCE_VIEW = "view"
    # Activity log entry written by a person or an AI agent (plane/liviere/activity/logs.py)
    SOURCE_LOG = "log"

    id = models.BigAutoField(primary_key=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    occurred_at = models.DateTimeField()
    kind = models.CharField(max_length=40)
    source = models.CharField(max_length=20)
    # Id of the IssueActivity row the event was copied from; makes the copy idempotent
    source_id = models.UUIDField(null=True)
    # The object acted on (no foreign keys: events outlive deleted objects)
    issue_id = models.UUIDField(null=True)
    page_id = models.UUIDField(null=True)
    object_id = models.UUIDField(null=True)
    # Log entries only: end of the time range (occurred_at is its start) and the text
    ended_at = models.DateTimeField(null=True)
    note = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True)

    class Meta:
        db_table = "liviere_activity_events"
        constraints = [
            models.UniqueConstraint(
                fields=["source", "source_id"],
                condition=models.Q(source_id__isnull=False),
                name="liviere_activity_event_unique_source",
            )
        ]
        indexes = [
            models.Index(fields=["project", "occurred_at"], name="liviere_act_project_time"),
            models.Index(fields=["project", "actor", "occurred_at"], name="liviere_act_project_actor"),
            models.Index(
                fields=["project", "ended_at"],
                condition=models.Q(ended_at__isnull=False),
                name="liviere_act_project_range",
            ),
        ]


class ProjectActivitySettings(models.Model):
    """Per-project switch of the "Activity" feature and the actions it counts."""

    project = models.OneToOneField("db.Project", on_delete=models.CASCADE, related_name="+", primary_key=True)
    enabled = models.BooleanField(default=False)
    kinds = models.JSONField(default=default_activity_kinds)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")

    class Meta:
        db_table = "liviere_project_activity_settings"


class WorkItemOpen(models.Model):
    """A person opened a work item (peek or full page) for the first time; see plane/liviere/unread."""

    id = models.BigAutoField(primary_key=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="+")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    opened_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "liviere_work_item_opens"
        constraints = [
            models.UniqueConstraint(fields=["user", "issue"], name="liviere_work_item_open_unique"),
        ]
        indexes = [
            models.Index(fields=["user", "project"], name="liviere_open_user_project"),
        ]


class UnreadWorkspaceCutoff(models.Model):
    """Work items created up to `since` are read for everybody (set to the deployment time by a migration)."""

    workspace = models.OneToOneField("db.Workspace", on_delete=models.CASCADE, related_name="+", primary_key=True)
    since = models.DateTimeField()

    class Meta:
        db_table = "liviere_unread_workspace_cutoffs"


class UnreadProjectCutoff(models.Model):
    """Work items of a project created up to `since` are read for one person ("Mark all as read")."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="+")
    since = models.DateTimeField()

    class Meta:
        db_table = "liviere_unread_project_cutoffs"
        constraints = [
            models.UniqueConstraint(fields=["user", "project"], name="liviere_unread_project_cutoff_unique"),
        ]
