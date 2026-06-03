# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel


class PropertyTypeEnum(models.TextChoices):
    """Supported custom field (work item property) types."""

    TEXT = "TEXT", "Text"
    DECIMAL = "DECIMAL", "Decimal"
    BOOLEAN = "BOOLEAN", "Boolean"
    DATETIME = "DATETIME", "Datetime"
    OPTION = "OPTION", "Option"
    RELATION = "RELATION", "Relation"
    URL = "URL", "URL"


class RelationTypeEnum(models.TextChoices):
    """Target of a RELATION property."""

    ISSUE = "ISSUE", "Issue"
    USER = "USER", "User"


class IssueProperty(ProjectBaseModel):
    """A custom field definition that belongs to a work item type."""

    issue_type = models.ForeignKey(
        "db.IssueType",
        on_delete=models.CASCADE,
        related_name="properties",
    )
    name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    property_type = models.CharField(max_length=255, choices=PropertyTypeEnum.choices)
    relation_type = models.CharField(max_length=255, choices=RelationTypeEnum.choices, blank=True, null=True)
    is_required = models.BooleanField(default=False)
    default_value = ArrayField(models.TextField(), default=list, blank=True)
    settings = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    is_multi = models.BooleanField(default=False)
    validation_rules = models.JSONField(default=dict)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Issue Property"
        verbose_name_plural = "Issue Properties"
        db_table = "issue_properties"
        ordering = ("sort_order",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            last_id = IssueProperty.objects.filter(issue_type=self.issue_type).aggregate(
                largest=models.Max("sort_order")
            )["largest"]
            if last_id is not None:
                self.sort_order = last_id + 10000
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.display_name} <{self.issue_type.name}>"


class IssuePropertyOption(ProjectBaseModel):
    """A selectable option for an OPTION (dropdown) property."""

    property = models.ForeignKey(
        "db.IssueProperty",
        on_delete=models.CASCADE,
        related_name="options",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Issue Property Option"
        verbose_name_plural = "Issue Property Options"
        db_table = "issue_property_options"
        ordering = ("sort_order",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            last_id = IssuePropertyOption.objects.filter(property=self.property).aggregate(
                largest=models.Max("sort_order")
            )["largest"]
            if last_id is not None:
                self.sort_order = last_id + 10000
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} <{self.property.display_name}>"


class IssuePropertyValue(ProjectBaseModel):
    """A single value of a custom field on a work item.

    Multi-select properties store one row per selected value. Each property type
    populates exactly one of the typed value columns.
    """

    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="property_values",
    )
    property = models.ForeignKey(
        "db.IssueProperty",
        on_delete=models.CASCADE,
        related_name="values",
    )
    # Typed value columns - exactly one is populated per row based on property_type
    value_text = models.TextField(blank=True, null=True)
    value_boolean = models.BooleanField(default=False)
    value_decimal = models.FloatField(default=0)
    value_datetime = models.DateTimeField(blank=True, null=True)
    value_uuid = models.UUIDField(blank=True, null=True)
    value_option = models.ForeignKey(
        "db.IssuePropertyOption",
        on_delete=models.CASCADE,
        related_name="property_values",
        blank=True,
        null=True,
    )
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Issue Property Value"
        verbose_name_plural = "Issue Property Values"
        db_table = "issue_property_values"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "property", "external_id"],
                condition=Q(deleted_at__isnull=True, external_id__isnull=False),
                name="issue_property_value_unique_external_id_when_not_deleted",
            )
        ]

    def __str__(self):
        return f"{self.property.display_name} <{self.issue_id}>"
