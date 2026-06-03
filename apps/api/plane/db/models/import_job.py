# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from .base import BaseModel


class ImportJob(BaseModel):
    """A workspace-scoped data import job (currently Jira).

    Unlike the legacy project-scoped ``Importer`` model, an import job can
    create new projects, so it is owned by the workspace. Source credentials
    live in ``config`` only for the lifetime of the job and are scrubbed once
    it finishes.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="import_jobs")
    source = models.CharField(max_length=50, default="jira", choices=(("jira", "Jira"),))
    status = models.CharField(
        max_length=50,
        choices=(
            ("queued", "Queued"),
            ("processing", "Processing"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ),
        default="queued",
    )
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="import_jobs",
    )
    # Selected source, target project mapping, state/priority maps, flags, and
    # (transient, write-only) source credentials.
    config = models.JSONField(default=dict)
    # Progress counters and per-entity error list.
    report = models.JSONField(default=dict)
    reason = models.TextField(blank=True)
    # Jira board/project key, used for idempotent re-runs.
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Import Job"
        verbose_name_plural = "Import Jobs"
        db_table = "import_jobs"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.source} <{self.workspace.name}>"
