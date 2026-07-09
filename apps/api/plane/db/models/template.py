# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from plane.db.models.project import ProjectBaseModel


class WorkItemTemplate(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="Template Name")
    description = models.TextField(verbose_name="Template Description", blank=True)
    type = models.ForeignKey(
        "db.IssueType",
        on_delete=models.SET_NULL,
        related_name="work_item_templates",
        null=True,
        blank=True,
    )
    priority = models.CharField(
        max_length=30,
        choices=(
            ("urgent", "Urgent"),
            ("high", "High"),
            ("medium", "Medium"),
            ("low", "Low"),
            ("none", "None"),
        ),
        verbose_name="Template Priority",
        default="none",
    )

    class Meta:
        verbose_name = "Work Item Template"
        verbose_name_plural = "Work Item Templates"
        db_table = "work_item_templates"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} <{self.project.name}>"


class WorkItemTemplateItem(ProjectBaseModel):
    template = models.ForeignKey(
        WorkItemTemplate,
        on_delete=models.CASCADE,
        related_name="items",
    )
    name = models.CharField(max_length=255, verbose_name="Item Name")
    description = models.TextField(verbose_name="Item Description", blank=True)
    priority = models.CharField(
        max_length=30,
        choices=(
            ("urgent", "Urgent"),
            ("high", "High"),
            ("medium", "Medium"),
            ("low", "Low"),
            ("none", "None"),
        ),
        verbose_name="Item Priority",
        default="none",
    )
    type = models.ForeignKey(
        "db.IssueType",
        on_delete=models.SET_NULL,
        related_name="work_item_template_items",
        null=True,
        blank=True,
    )
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Work Item Template Item"
        verbose_name_plural = "Work Item Template Items"
        db_table = "work_item_template_items"
        ordering = ("sort_order", "-created_at")

    def __str__(self):
        return f"{self.name} ({self.template.name})"


class WorkItemTemplateDependency(ProjectBaseModel):
    template = models.ForeignKey(
        WorkItemTemplate,
        on_delete=models.CASCADE,
        related_name="dependencies",
    )
    source_template_item = models.ForeignKey(
        WorkItemTemplateItem,
        on_delete=models.CASCADE,
        related_name="source_dependencies",
    )
    target_template_item = models.ForeignKey(
        WorkItemTemplateItem,
        on_delete=models.CASCADE,
        related_name="target_dependencies",
    )
    relation_type = models.CharField(
        max_length=20,
        default="blocked_by",
    )
    # Project and workspace are inherited from parent project/workspace

    class Meta:
        verbose_name = "Work Item Template Dependency"
        verbose_name_plural = "Work Item Template Dependencies"
        db_table = "work_item_template_dependencies"
        unique_together = ["template", "source_template_item", "target_template_item", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["template", "source_template_item", "target_template_item"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_active_template_dependency",
            )
        ]

    def __str__(self):
        return f"{self.source_template_item.name} -> {self.target_template_item.name}"
