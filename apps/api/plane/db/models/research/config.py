# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models.base import BaseModel


class ReportVisibility(models.TextChoices):
    """Report access levels, ordered from the narrowest to the widest scope."""

    PRIVATE = "PRIVATE", "Private"
    DIRECT_ADVISOR = "DIRECT_ADVISOR", "Direct advisors"
    UNIT = "UNIT", "Organisation unit"
    ANCESTRY = "ANCESTRY", "Ancestry principal investigators"
    WORKSPACE = "WORKSPACE", "Workspace"
    CUSTOM = "CUSTOM", "Custom grants"


class WorkspaceResearchSetting(BaseModel):
    """Per workspace research platform configuration (P0-CFG-01 ~ P0-CFG-08)."""

    workspace = models.OneToOneField(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_setting",
    )
    module_enabled = models.BooleanField(default=False)
    org_enabled = models.BooleanField(default=True)
    report_enabled = models.BooleanField(default=True)
    approval_enabled = models.BooleanField(default=True)
    allow_multiple_projects = models.BooleanField(default=False)
    default_report_visibility = models.CharField(
        max_length=32,
        choices=ReportVisibility.choices,
        default=ReportVisibility.DIRECT_ADVISOR,
    )
    # Optional per type overrides; empty means "fall back to the default above"
    weekly_default_visibility = models.CharField(
        max_length=32,
        choices=ReportVisibility.choices,
        null=True,
        blank=True,
    )
    monthly_default_visibility = models.CharField(
        max_length=32,
        choices=ReportVisibility.choices,
        null=True,
        blank=True,
    )
    image_max_mb = models.PositiveIntegerField(default=20)
    pdf_max_mb = models.PositiveIntegerField(default=100)
    markdown_max_mb = models.PositiveIntegerField(default=5)
    timezone = models.CharField(max_length=255, null=True, blank=True)
    audit_retention_days = models.PositiveIntegerField(default=0)
    # ------------------------------------------------------------------
    # P1 sub switches and gate defaults (§4.9). All additive and optional:
    # an existing row keeps working with the defaults below.
    # ------------------------------------------------------------------
    stage_enabled = models.BooleanField(default=True)
    experiment_enabled = models.BooleanField(default=True)
    code_enabled = models.BooleanField(default=True)
    integration_enabled = models.BooleanField(default=True)
    literature_min_included = models.PositiveIntegerField(default=20)
    literature_max_entries = models.PositiveIntegerField(default=100)
    stage_min_reviewers = models.PositiveIntegerField(default=3)
    stage_pass_ratio = models.FloatField(default=0.5)
    code_snapshot_max_mb = models.PositiveIntegerField(default=500)

    class Meta:
        verbose_name = "Workspace Research Setting"
        verbose_name_plural = "Workspace Research Settings"
        db_table = "workspace_research_settings"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace_id} <research>"

    def default_visibility_for(self, report_type):
        if report_type == "WEEKLY" and self.weekly_default_visibility:
            return self.weekly_default_visibility
        if report_type == "MONTHLY" and self.monthly_default_visibility:
            return self.monthly_default_visibility
        return self.default_report_visibility
