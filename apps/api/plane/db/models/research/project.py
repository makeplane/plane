# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from plane.db.models.base import BaseModel


class ResearchProjectProfile(BaseModel):
    """Research metadata attached one-to-one to a Plane ``Project``.

    The upstream ``Project`` model is never modified: a research project is a
    normal project plus this profile (P0-PRJ-01).
    """

    class ResearchType(models.TextChoices):
        PHD = "PHD", "PhD"
        MASTER = "MASTER", "Master"
        POSTDOC = "POSTDOC", "Postdoc"
        RESEARCH_PROJECT = "RESEARCH_PROJECT", "Research project"

    class WorkflowStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ARCHIVED = "ARCHIVED", "Archived"
        COMPLETED = "COMPLETED", "Completed"

    project = models.OneToOneField(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="research_profile",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_project_profiles",
    )
    owner = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_project_profiles",
    )
    org_unit = models.ForeignKey(
        "db.OrgUnit",
        on_delete=models.SET_NULL,
        related_name="research_project_profiles",
        null=True,
        blank=True,
    )
    research_type = models.CharField(
        max_length=32,
        choices=ResearchType.choices,
        default=ResearchType.RESEARCH_PROJECT,
    )
    workflow_status = models.CharField(
        max_length=16,
        choices=WorkflowStatus.choices,
        default=WorkflowStatus.ACTIVE,
    )
    started_at = models.DateField(null=True, blank=True)
    expected_end_at = models.DateField(null=True, blank=True)
    completed_at = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    # Redundant current stage for list filtering and summaries; maintained by
    # the stage service only (D-14), never written directly by clients.
    current_stage = models.CharField(max_length=16, null=True, blank=True)

    class Meta:
        verbose_name = "Research Project Profile"
        verbose_name_plural = "Research Project Profiles"
        db_table = "research_project_profiles"
        ordering = ("-created_at",)
        # "one active research project per owner" (P0-PRJ-02) is enforced in the
        # application layer inside a transaction: a database constraint would
        # also block the documented "allow multiple projects" relaxation.
        indexes = [
            models.Index(fields=["workspace", "workflow_status"], name="rsch_project_ws_status_idx"),
            models.Index(fields=["org_unit"], name="rsch_project_org_unit_idx"),
            models.Index(fields=["workspace", "owner"], name="rsch_project_ws_owner_idx"),
        ]

    def __str__(self):
        return f"{self.project_id} <{self.research_type}>"
