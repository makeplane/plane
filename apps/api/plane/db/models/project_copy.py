# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from .base import BaseModel


class ProjectCopyJob(BaseModel):
    """Tracks the status of a project copy operation across workspaces."""

    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    source_project = models.ForeignKey(
        "db.Project",
        on_delete=models.PROTECT,
        related_name="copy_jobs_as_source",
    )
    source_workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.PROTECT,
        related_name="copy_jobs_as_source",
    )
    target_workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.PROTECT,
        related_name="copy_jobs_as_target",
    )
    # Who triggered this copy job (stored explicitly so it survives the BaseModel
    # auto-set logic and is available even if the request context is lost).
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="initiated_project_copy_jobs",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.QUEUED,
        db_index=True,
    )
    identifier = models.CharField(max_length=12, blank=True, default="")
    name_override = models.CharField(max_length=255, blank=True, default="")
    new_project_id = models.UUIDField(null=True, blank=True)
    error = models.TextField(blank=True)

    class Meta:
        db_table = "project_copy_jobs"
        verbose_name = "Project Copy Job"
        verbose_name_plural = "Project Copy Jobs"
        ordering = ("-created_at",)

    def __str__(self):
        return f"CopyJob {self.id}: {self.source_project_id} → {self.target_workspace_id} [{self.status}]"
