# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Research outcomes and their links (§4.8, P1-FIN-02 ~ P1-FIN-04)."""

from django.db import models

from plane.db.models.base import BaseModel

from .config import ReportVisibility


class ResearchOutcome(BaseModel):
    """A paper, patent, software, dataset, award or other result."""

    class OutputType(models.TextChoices):
        PAPER = "PAPER", "Paper"
        PATENT = "PATENT", "Patent"
        SOFTWARE = "SOFTWARE", "Software"
        DATASET = "DATASET", "Dataset"
        AWARD = "AWARD", "Award"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        ACCEPTED = "ACCEPTED", "Accepted"
        PUBLISHED = "PUBLISHED", "Published"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_outcomes",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="research_outcomes",
    )
    output_type = models.CharField(max_length=16, choices=OutputType.choices, default=OutputType.PAPER)
    title = models.CharField(max_length=500)
    authors = models.JSONField(default=list, blank=True)
    venue = models.CharField(max_length=255, blank=True, default="")
    doi = models.CharField(max_length=255, blank=True, default="")
    external_url = models.URLField(max_length=500, blank=True, default="")
    file_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        related_name="research_outcomes",
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    published_at = models.DateField(null=True, blank=True)
    visibility = models.CharField(
        max_length=32,
        choices=ReportVisibility.choices,
        default=ReportVisibility.DIRECT_ADVISOR,
    )

    class Meta:
        verbose_name = "Research Outcome"
        verbose_name_plural = "Research Outcomes"
        db_table = "research_outcomes"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["project", "output_type", "status"], name="rsch_outcome_project_idx"),
            models.Index(fields=["workspace", "status", "published_at"], name="rsch_outcome_ws_status_idx"),
        ]

    def __str__(self):
        return f"{self.project_id} <{self.output_type}:{self.title[:40]}>"


class ResearchOutcomeLink(BaseModel):
    """Link from an outcome to an experiment, artifact, material or report."""

    class TargetType(models.TextChoices):
        EXPERIMENT_RECORD = "EXPERIMENT_RECORD", "Experiment record"
        CODE_ARTIFACT = "CODE_ARTIFACT", "Code artifact"
        STAGE_MATERIAL = "STAGE_MATERIAL", "Stage material"
        PERIODIC_REPORT = "PERIODIC_REPORT", "Periodic report"

    outcome = models.ForeignKey(
        ResearchOutcome,
        on_delete=models.CASCADE,
        related_name="links",
    )
    target_type = models.CharField(max_length=32, choices=TargetType.choices)
    target_id = models.UUIDField()

    class Meta:
        verbose_name = "Research Outcome Link"
        verbose_name_plural = "Research Outcome Links"
        db_table = "research_outcome_links"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["outcome", "target_type", "target_id"],
                name="rsch_outcome_link_uq",
            ),
        ]
        indexes = [
            models.Index(fields=["target_type", "target_id"], name="rsch_outcome_link_target_idx"),
        ]

    def __str__(self):
        return f"{self.outcome_id} -> {self.target_type}:{self.target_id}"
