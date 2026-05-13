# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from .base import BaseModel


class CapacityExportJob(BaseModel):
    """Tracks each capacity export request: filters, status lifecycle, file location, expiry."""

    STATUS_CHOICES = [
        ("queued", "Queued"),
        ("processing", "Processing"),
        ("ready", "Ready"),
        ("failed", "Failed"),
        ("expired", "Expired"),
    ]

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="capacity_export_jobs",
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="capacity_export_jobs",
    )
    date_from = models.DateField(verbose_name="Date From")
    date_to = models.DateField(verbose_name="Date To")
    # Snapshot of member UUIDs used as filter; empty list means all members
    member_ids = models.JSONField(default=list, blank=True)
    cross_workspace = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="queued",
    )
    # S3 object key — treat as semi-secret; only serialize for owner
    file_key = models.CharField(max_length=800, null=True, blank=True)
    # Presigned URL — short-lived; regenerated on each access
    file_url = models.TextField(null=True, blank=True)
    file_size = models.BigIntegerField(default=0)
    row_count = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, default="")
    expires_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Capacity Export Job"
        verbose_name_plural = "Capacity Export Jobs"
        db_table = "capacity_export_jobs"
        ordering = ["-created_at"]
        indexes = [
            # My Exports list — filter by requester, ordered newest-first
            models.Index(fields=["requested_by", "-created_at"], name="cap_exp_requester_created_idx"),
            # Admin queries — filter by workspace + status
            models.Index(fields=["workspace", "status"], name="cap_exp_workspace_status_idx"),
            # Cleanup scan — find expired rows
            models.Index(fields=["expires_at"], name="cap_exp_expires_at_idx"),
        ]

    def __str__(self):
        return f"CapacityExportJob({self.status}) by {self.requested_by_id} @ {self.workspace_id}"
