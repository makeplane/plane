# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from .project import ProjectBaseModel


class IssueWorkLog(ProjectBaseModel):
    """A single time-tracking entry (worklog) logged against a work item.

    ``duration`` is stored in **minutes**. ``logged_by`` is the member who
    logged the time; it is set from the authenticated user on creation and is
    never client-writable. It is kept on **SET_NULL** so that a worklog — a
    billing/audit record — survives the deletion of the user who logged it
    (same rationale as ``IssueActivity.actor``). ``ProjectBaseModel`` provides
    ``project`` and ``workspace`` (kept in sync on save) while ``BaseModel``
    provides ``id``, ``created_by``/``updated_by`` and the audit/soft-delete
    timestamps.
    """

    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="issue_worklogs")
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="worklogs",
    )
    duration = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True, default="")
    # external_id for imports / integrations
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = "Issue Work Log"
        verbose_name_plural = "Issue Work Logs"
        db_table = "issue_worklogs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["issue"], name="issue_worklogs_issue_id_idx"),
            models.Index(fields=["project", "logged_by"], name="issue_worklogs_proj_logged_idx"),
        ]

    def __str__(self):
        return f"{self.issue_id} <{self.duration}m>"
