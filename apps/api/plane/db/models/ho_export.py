# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from .base import BaseModel


class HoExportJob(BaseModel):
    """Tracks each HO Datasheet export: filters snapshot, status lifecycle, file location, expiry."""

    STATUS_CHOICES = [
        ("queued", "Queued"),
        ("processing", "Processing"),
        ("ready", "Ready"),
        ("failed", "Failed"),
        ("expired", "Expired"),
    ]

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ho_export_jobs",
    )
    # Snapshot of active query filters (from_date, to_date, workspace_id, etc.)
    filters = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="queued")
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
        verbose_name = "HO Export Job"
        verbose_name_plural = "HO Export Jobs"
        db_table = "ho_export_jobs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["requested_by", "-created_at"], name="ho_exp_requester_created_idx"),
            models.Index(fields=["expires_at"], name="ho_exp_expires_at_idx"),
        ]

    def __str__(self):
        return f"HoExportJob({self.status}) by {self.requested_by_id}"
