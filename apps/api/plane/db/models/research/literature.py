# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Literature entries for the pre-opening stage (P1-LIT-01 ~ P1-LIT-12, §4.4).

The body of a pre-opening argument lives in the stage materials; a literature
entry is the management record: what was collected, what was screened in, and
why it matters. Only ``INCLUDED`` entries count towards the quantitative gate.
"""

from django.db import models
from django.db.models import Q

from plane.db.models.base import BaseModel

from .config import ReportVisibility


class LiteratureEntry(BaseModel):
    """One literature record of a research project (P1-LIT-01)."""

    class Status(models.TextChoices):
        COLLECTED = "COLLECTED", "Collected"
        SCREENED = "SCREENED", "Screened"
        INCLUDED = "INCLUDED", "Included"
        EXCLUDED = "EXCLUDED", "Excluded"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_literature_entries",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="research_literature_entries",
    )
    owner = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_literature_entries",
    )
    title = models.CharField(max_length=500)
    authors = models.TextField(blank=True, default="")
    year = models.PositiveSmallIntegerField(null=True, blank=True)
    venue = models.CharField(max_length=255, blank=True, default="")
    doi = models.CharField(max_length=255, blank=True, default="", db_index=True)
    url = models.URLField(max_length=500, blank=True, default="")
    pdf_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        related_name="research_literature_entries",
        null=True,
        blank=True,
    )
    summary = models.TextField(blank=True, default="")
    method_tags = models.JSONField(default=list, blank=True)
    system_tags = models.JSONField(default=list, blank=True)
    gap_notes = models.TextField(blank=True, default="")
    relevance_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.COLLECTED)
    visibility = models.CharField(
        max_length=32,
        choices=ReportVisibility.choices,
        default=ReportVisibility.DIRECT_ADVISOR,
    )
    stage_instance = models.ForeignKey(
        "db.ResearchStageInstance",
        on_delete=models.SET_NULL,
        related_name="literature_entries",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Literature Entry"
        verbose_name_plural = "Literature Entries"
        db_table = "research_literature_entries"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["project", "doi"],
                condition=Q(deleted_at__isnull=True) & ~Q(doi=""),
                name="rsch_literature_uq_project_doi",
            ),
        ]
        indexes = [
            models.Index(fields=["project", "status"], name="rsch_literature_project_idx"),
            models.Index(fields=["workspace", "status", "updated_at"], name="rsch_lit_ws_status_upd_idx"),
            models.Index(fields=["project", "year"], name="rsch_literature_year_idx"),
        ]

    def __str__(self):
        return f"{self.project_id} <{self.title[:40]}>"

    @property
    def is_annotated(self):
        return bool((self.summary or "").strip()) and bool((self.gap_notes or "").strip())

    @property
    def has_verifiable_source(self):
        return bool((self.doi or "").strip() or (self.url or "").strip() or (self.venue or "").strip())
