# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from .project import ProjectBaseModel


class PropertyTypeEnum(models.TextChoices):
    """Supported custom property data types.

    V1 exposes TEXT, DECIMAL, BOOLEAN, DATETIME, OPTION, RELATION and URL.
    EMAIL, FILE and FORMULA are reserved for later releases and are not
    accepted by the serializers yet.
    """

    TEXT = "TEXT", "Text"
    DECIMAL = "DECIMAL", "Decimal"
    BOOLEAN = "BOOLEAN", "Boolean"
    DATETIME = "DATETIME", "Datetime"
    OPTION = "OPTION", "Option"
    RELATION = "RELATION", "Relation"
    URL = "URL", "URL"
    # Reserved (not exposed in V1)
    EMAIL = "EMAIL", "Email"
    FILE = "FILE", "File"
    FORMULA = "FORMULA", "Formula"


class RelationTypeEnum(models.TextChoices):
    """Target of a RELATION property."""

    USER = "USER", "User"
    ISSUE = "ISSUE", "Issue"


class IssueProperty(ProjectBaseModel):
    """Definition of a custom property attached to a work item type."""

    issue_type = models.ForeignKey("db.IssueType", related_name="properties", on_delete=models.CASCADE)
    display_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    property_type = models.CharField(max_length=255, choices=PropertyTypeEnum.choices)
    relation_type = models.CharField(max_length=255, choices=RelationTypeEnum.choices, null=True, blank=True)
    is_required = models.BooleanField(default=False)
    is_multi = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    default_value = models.TextField(null=True, blank=True)
    settings = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = "Issue Property"
        verbose_name_plural = "Issue Properties"
        db_table = "issue_properties"
        ordering = ("sort_order",)
        indexes = [models.Index(fields=["issue_type", "project"], name="issue_prop_type_project_idx")]

    def __str__(self):
        return f"{self.display_name} <{self.property_type}>"


class IssuePropertyOption(ProjectBaseModel):
    """A selectable option for an OPTION property."""

    property = models.ForeignKey("db.IssueProperty", related_name="options", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    sort_order = models.FloatField(default=65535)
    logo_props = models.JSONField(default=dict)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = "Issue Property Option"
        verbose_name_plural = "Issue Property Options"
        db_table = "issue_property_options"
        ordering = ("sort_order",)
        indexes = [models.Index(fields=["property", "project"], name="issue_prop_opt_prop_proj_idx")]

    def __str__(self):
        return f"{self.name}"


class IssuePropertyValue(ProjectBaseModel):
    """A typed value of a custom property for a specific work item.

    Values are stored in typed columns (one family per column) so they stay
    queryable/filterable. ``is_multi`` properties keep several rows per
    ``(issue, property)`` pair.
    """

    issue = models.ForeignKey("db.Issue", related_name="property_values", on_delete=models.CASCADE)
    property = models.ForeignKey("db.IssueProperty", related_name="values", on_delete=models.CASCADE)
    value_text = models.TextField(null=True, blank=True)
    value_boolean = models.BooleanField(null=True, blank=True)
    value_decimal = models.DecimalField(max_digits=30, decimal_places=10, null=True, blank=True)
    value_datetime = models.DateTimeField(null=True, blank=True)
    value_uuid = models.UUIDField(null=True, blank=True)
    value_option = models.ForeignKey(
        "db.IssuePropertyOption",
        related_name="property_values",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = "Issue Property Value"
        verbose_name_plural = "Issue Property Values"
        db_table = "issue_property_values"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["issue", "property"], name="issue_prop_val_issue_prop_idx")]

    def __str__(self):
        return f"{self.issue_id} - {self.property_id}"
