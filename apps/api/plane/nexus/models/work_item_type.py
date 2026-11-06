# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Models for the work_item_type feature group. See plane/nexus/README.md.

Work item types themselves reuse Plane's `db.IssueType` (the workspace catalogue)
and `db.ProjectIssueType` (a type imported into a project). Everything below is
what Community Edition has no table for. Rows here are hard-deleted, so a
deleted property takes its options, type links and values with it.
"""

from django.db import models
from django.db.models import Q

from plane.db.models import BaseModel

__all__ = [
    "WorkItemProperty",
    "WorkItemTypeProperty",
    "WorkItemPropertyOption",
    "WorkItemPropertyValue",
    "WorkItemTemplate",
    "WorkItemRelationDefinition",
]

# plane-sdk PropertyType and RelationType.
PROPERTY_TYPES = (
    "TEXT",
    "DATETIME",
    "DECIMAL",
    "BOOLEAN",
    "OPTION",
    "RELATION",
    "URL",
    "EMAIL",
    "FILE",
    "FORMULA",
    "CASCADING",
)
RELATION_TYPES = ("ISSUE", "USER", "RELEASE", "RICH_TEXT")


class WorkItemProperty(BaseModel):
    """A custom property in the workspace catalogue, attached to types via WorkItemTypeProperty."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_wi_properties")
    name = models.CharField(max_length=255, blank=True)
    display_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    logo_props = models.JSONField(default=dict, blank=True)
    sort_order = models.FloatField(default=65535)
    property_type = models.CharField(max_length=32, choices=[(t, t) for t in PROPERTY_TYPES])
    relation_type = models.CharField(max_length=32, choices=[(t, t) for t in RELATION_TYPES], null=True, blank=True)
    is_required = models.BooleanField(default=False)
    default_value = models.JSONField(default=list, blank=True)
    settings = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    is_multi = models.BooleanField(default=False)
    validation_rules = models.JSONField(null=True, blank=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "nexus_work_item_properties"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "display_name"],
                condition=Q(deleted_at__isnull=True),
                name="nexus_wi_property_unique_display_name",
            )
        ]


class WorkItemTypeProperty(BaseModel):
    """A workspace property attached to a workspace work item type."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_wi_type_properties")
    issue_type = models.ForeignKey("db.IssueType", on_delete=models.CASCADE, related_name="nexus_wi_type_properties")
    property = models.ForeignKey(WorkItemProperty, on_delete=models.CASCADE, related_name="type_links")
    sort_order = models.FloatField(default=65535)

    class Meta:
        db_table = "nexus_work_item_type_properties"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["issue_type", "property"],
                condition=Q(deleted_at__isnull=True),
                name="nexus_wi_type_property_unique",
            )
        ]


class WorkItemPropertyOption(BaseModel):
    """One choice of an OPTION (or CASCADING) property."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_wi_property_options")
    property = models.ForeignKey(WorkItemProperty, on_delete=models.CASCADE, related_name="options")
    name = models.CharField(max_length=255)
    sort_order = models.FloatField(default=65535)
    description = models.TextField(blank=True, default="")
    logo_props = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="children")
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "nexus_work_item_property_options"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["property", "name"],
                condition=Q(deleted_at__isnull=True),
                name="nexus_wi_property_option_unique_name",
            )
        ]


class WorkItemPropertyValue(BaseModel):
    """A property's value on one work item. A multi-value property has one row per value."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_wi_property_values")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="nexus_wi_property_values")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="nexus_wi_property_values")
    property = models.ForeignKey(WorkItemProperty, on_delete=models.CASCADE, related_name="values")
    # TEXT/URL/EMAIL/FILE, a DATETIME exactly as sent, and RICH_TEXT's sanitised HTML.
    value_text = models.TextField(null=True, blank=True)
    value_boolean = models.BooleanField(null=True, blank=True)
    value_decimal = models.FloatField(null=True, blank=True)
    value_datetime = models.DateTimeField(null=True, blank=True)
    # RELATION targets: a work item, user or release id.
    value_uuid = models.UUIDField(null=True, blank=True)
    value_option = models.ForeignKey(
        WorkItemPropertyOption, on_delete=models.CASCADE, null=True, blank=True, related_name="values"
    )
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "nexus_work_item_property_values"
        ordering = ("created_at",)
        indexes = [models.Index(fields=["issue", "property"], name="nexus_wi_prop_value_issue_idx")]


class WorkItemTemplate(BaseModel):
    """A work item template at the workspace (project is null) or in one project."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_wi_templates")
    project = models.ForeignKey(
        "db.Project", on_delete=models.CASCADE, null=True, blank=True, related_name="nexus_wi_templates"
    )
    name = models.CharField(max_length=255)
    # Workspace templates carry their summary as description_html, project ones as short_description.
    description_html = models.TextField(blank=True, default="")
    short_description = models.TextField(blank=True, default="")
    template_data = models.JSONField(default=dict, blank=True)
    logo_props = models.JSONField(default=dict, blank=True)
    template_type = models.CharField(max_length=32, default="WORK_ITEM")

    class Meta:
        db_table = "nexus_work_item_templates"
        ordering = ("-created_at",)


class WorkItemRelationDefinition(BaseModel):
    """A workspace-defined relation between work items, with an outward and an inward label."""

    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="nexus_wi_relation_definitions"
    )
    name = models.CharField(max_length=255)
    outward = models.CharField(max_length=255, blank=True, default="")
    inward = models.CharField(max_length=255, blank=True, default="")
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    color = models.CharField(max_length=32, blank=True, default="")
    sort_order = models.FloatField(default=65535)

    class Meta:
        db_table = "nexus_work_item_relation_definitions"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="nexus_wi_relation_definition_unique_name",
            )
        ]
