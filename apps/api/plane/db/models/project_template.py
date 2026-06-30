# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from .base import BaseModel


class ProjectTemplate(BaseModel):
    """A persisted Project Template used to scaffold new projects.

    Built-in templates are global records (workspace_id NULL, is_system=True)
    seeded by a data migration and remain read-only. Custom templates are
    workspace-scoped and admin-managed (see D-09..D-12 in CONTEXT.md).
    """

    class TemplateType(models.TextChoices):
        BUILT_IN = "built_in", "Built-in"
        CUSTOM = "custom", "Custom"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="project_templates",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    template_type = models.CharField(
        max_length=20,
        choices=TemplateType.choices,
        default=TemplateType.CUSTOM,
    )
    system_key = models.SlugField(max_length=100, null=True, blank=True)
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    # Optional integer relative date metadata; Phase 1 only validates type and
    # order. Phase 2 interprets these values during template application.
    start_offset_days = models.IntegerField(null=True, blank=True)
    target_offset_days = models.IntegerField(null=True, blank=True)
    duration_days = models.IntegerField(null=True, blank=True)
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Project Template"
        verbose_name_plural = "Project Templates"
        db_table = "project_templates"
        ordering = ("name",)
        constraints = [
            # A stable system_key must be unique across the whole global catalog
            # so the seed migration can re-sync built-ins safely (D-12).
            models.UniqueConstraint(
                fields=["system_key"],
                condition=Q(is_system=True) & Q(workspace__isnull=True),
                name="project_template_unique_system_key_when_system_global",
            ),
            # Custom templates per workspace must have unique active names.
            # Soft-deactivated rows (is_active=False) are excluded so re-creating
            # a template after a previous deactivate does not collide.
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(is_system=False) & Q(is_active=True),
                name="project_template_unique_active_name_per_workspace",
            ),
        ]

    def __str__(self):
        return f"{self.name} <{'system' if self.is_system else 'custom'}>"
