# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from plane.db.models.base import BaseModel

from .report import PeriodicReport


class ReportAttachment(BaseModel):
    """Attachment registered against a report (P0-FILE-02).

    The file itself lives in the shared ``FileAsset`` + S3 pipeline, so report
    attachments never introduce a second storage path.
    """

    class Kind(models.TextChoices):
        IMAGE = "IMAGE", "Image"
        PDF = "PDF", "PDF"
        MARKDOWN = "MARKDOWN", "Markdown"
        OTHER = "OTHER", "Other"

    report = models.ForeignKey(
        PeriodicReport,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.CASCADE,
        related_name="research_report_attachments",
    )
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.OTHER)
    file_name = models.CharField(max_length=255, blank=True, default="")
    file_size = models.BigIntegerField(default=0)
    content_type = models.CharField(max_length=255, blank=True, default="")
    uploaded_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_report_attachments",
        null=True,
    )

    class Meta:
        verbose_name = "Report Attachment"
        verbose_name_plural = "Report Attachments"
        db_table = "research_report_attachments"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["report", "asset"],
                condition=Q(deleted_at__isnull=True),
                name="rsch_attachment_uq_report_asset",
            ),
        ]
        indexes = [
            models.Index(fields=["report", "kind"], name="rsch_attachment_report_idx"),
        ]

    def __str__(self):
        return f"{self.file_name} <{self.report_id}>"
