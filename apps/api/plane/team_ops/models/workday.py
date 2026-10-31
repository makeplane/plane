# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from plane.db.models.base import BaseModel


class WorkDay(BaseModel):
    """How a person works on a day, answered when the day starts."""

    class Mode(models.TextChoices):
        REMOTE = "REMOTE", "Remote"
        ONSITE = "ONSITE", "Onsite"
        HYBRID = "HYBRID", "Hybrid"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_work_days")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_work_days")
    date = models.DateField()
    mode = models.CharField(max_length=10, choices=Mode.choices)

    class Meta:
        verbose_name = "Work Day"
        verbose_name_plural = "Work Days"
        db_table = "tops_work_day"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user", "date"],
                condition=Q(deleted_at__isnull=True),
                name="tops_work_day_one_per_user_day",
            )
        ]


class WorkInterruption(BaseModel):
    """Time taken out of a running timer: a rest pause, or a freeze when a check-in was not answered."""

    class Kind(models.TextChoices):
        BREAK = "BREAK", "Break"
        FREEZE = "FREEZE", "Freeze"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_interruptions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_interruptions")
    kind = models.CharField(max_length=10, choices=Kind.choices)
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.SET_NULL, null=True, blank=True, related_name="team_ops_interruptions"
    )
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    session = models.ForeignKey(
        "team_ops.WorkSession", on_delete=models.SET_NULL, null=True, blank=True, related_name="interruptions"
    )

    class Meta:
        verbose_name = "Work Interruption"
        verbose_name_plural = "Work Interruptions"
        db_table = "tops_work_interruption"
        ordering = ("started_at",)
        indexes = [models.Index(fields=["workspace", "user", "started_at"], name="tops_wi_user_started_idx")]


class OpsNotification(BaseModel):
    """Something a person should look at: a tag, an attention request, a freeze, news, a message, a shared secret."""

    class Kind(models.TextChoices):
        MENTION = "MENTION", "Mention"
        ATTENTION = "ATTENTION", "Needs attention"
        FREEZE = "FREEZE", "Freeze"
        NEWS = "NEWS", "News"
        DIRECT = "DIRECT", "Direct message"
        SECRET = "SECRET", "Secret shared"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_notifications")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_notifications")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    kind = models.CharField(max_length=10, choices=Kind.choices)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, default="")
    # A path inside the app, e.g. `team-ops/hub?channel=<id>`.
    link = models.CharField(max_length=300, blank=True, default="")
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        db_table = "tops_notification"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["user", "read_at", "created_at"], name="tops_notif_user_read_idx")]
