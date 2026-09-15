# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from plane.db.models.base import BaseModel


def get_default_template_content():
    return {"type": "doc", "content": []}


class ReportTemplate(BaseModel):
    """Weekly / monthly report template (P0-CFG-05).

    The template body reuses the Page rich-text structure so it can be handed to
    the shared editor without a second document format.
    """

    REPORT_TYPE_CHOICES = (("WEEKLY", "Weekly"), ("MONTHLY", "Monthly"))

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_report_templates",
    )
    report_type = models.CharField(max_length=16, choices=REPORT_TYPE_CHOICES)
    name = models.CharField(max_length=255)
    content_json = models.JSONField(default=get_default_template_content, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Research Report Template"
        verbose_name_plural = "Research Report Templates"
        db_table = "research_report_templates"
        ordering = ("report_type", "name")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "report_type", "name"],
                condition=Q(deleted_at__isnull=True),
                name="rsch_template_uq_ws_type_name",
            ),
            models.UniqueConstraint(
                fields=["workspace", "report_type"],
                condition=Q(is_default=True, deleted_at__isnull=True),
                name="rsch_template_uq_default",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "report_type"], name="rsch_template_ws_type_idx"),
        ]

    def __str__(self):
        return f"{self.report_type} <{self.name}>"
