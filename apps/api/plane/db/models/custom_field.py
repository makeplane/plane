# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from plane.db.models import BaseModel


class CustomFieldEntityType(models.TextChoices):
    PROJECT = "project", "Project"
    WORK_ITEM = "work_item", "Work Item"


class CustomFieldType(models.TextChoices):
    TEXT = "text", "Text"
    PARAGRAPH = "paragraph", "Paragraph"
    NUMBER = "number", "Number"
    SINGLE_SELECT = "single_select", "Single select"
    MULTI_SELECT = "multi_select", "Multi select"
    BOOLEAN = "boolean", "Checkbox"
    RADIO = "radio", "Radio"
    DATE = "date", "Date"
    DATETIME = "datetime", "Date time"
    COLOR = "color", "Color"
    URL = "url", "Hyperlink"
    EMAIL = "email", "Email"


class CustomField(BaseModel):
    """Workspace-scoped custom field definition.

    A single definition model with an ``entity_type`` discriminator so the same
    machinery powers project custom fields (phase 1) and work-item custom fields
    (phase 2).
    """

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="custom_fields",
    )
    entity_type = models.CharField(
        max_length=20,
        choices=CustomFieldEntityType.choices,
        default=CustomFieldEntityType.PROJECT,
        db_index=True,
    )
    display_name = models.CharField(max_length=255)
    # internal slug, auto-generated from display_name, unique per (workspace, entity_type)
    key = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    field_type = models.CharField(max_length=20, choices=CustomFieldType.choices)
    # type-specific configuration (options list, min/max, placeholder, etc.)
    settings = models.JSONField(default=dict, blank=True)
    default_value = models.JSONField(null=True, blank=True)
    is_required = models.BooleanField(default=False)
    # visibility: when True only workspace admins see/edit the field
    admin_only = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.FloatField(default=65535)
    # 12-column grid width (1..12)
    width = models.PositiveSmallIntegerField(default=12)

    def __str__(self):
        return f"{self.workspace.slug} {self.entity_type} {self.display_name}"

    class Meta:
        verbose_name = "Custom Field"
        verbose_name_plural = "Custom Fields"
        db_table = "custom_fields"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "entity_type", "key"],
                condition=models.Q(deleted_at__isnull=True),
                name="custom_field_unique_key_per_entity_when_deleted_at_null",
            )
        ]


class CustomFieldValue(BaseModel):
    """Stored value of a custom field for a concrete entity (a project in phase 1)."""

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="custom_field_values",
    )
    custom_field = models.ForeignKey(
        "db.CustomField",
        on_delete=models.CASCADE,
        related_name="values",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="custom_field_values",
        null=True,
        blank=True,
    )
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="custom_field_values",
        null=True,
        blank=True,
    )
    value = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.custom_field_id} {self.project_id}"

    class Meta:
        verbose_name = "Custom Field Value"
        verbose_name_plural = "Custom Field Values"
        db_table = "custom_field_values"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["custom_field", "project"],
                condition=models.Q(deleted_at__isnull=True, project__isnull=False),
                name="custom_field_value_unique_field_project_when_deleted_at_null",
            ),
            models.UniqueConstraint(
                fields=["custom_field", "issue"],
                condition=models.Q(deleted_at__isnull=True, issue__isnull=False),
                name="custom_field_value_unique_field_issue_when_deleted_at_null",
            ),
        ]
