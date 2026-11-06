# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Customers, their custom properties and values, requests, and work item links.

Every row is workspace scoped and soft deleted (`deleted_at`), like Plane's own
tables. Uniqueness only holds among rows that are not deleted.
"""

from django.db import models
from django.db.models import Q

from plane.db.models import BaseModel

__all__ = [
    "Customer",
    "CustomerProperty",
    "CustomerPropertyOption",
    "CustomerPropertyValue",
    "CustomerRequest",
    "CustomerWorkItem",
    "CUSTOMER_PROPERTY_TYPES",
    "CUSTOMER_RELATION_TYPES",
]

CUSTOMER_PROPERTY_TYPES = ("TEXT", "DATETIME", "DECIMAL", "BOOLEAN", "OPTION", "RELATION", "URL", "EMAIL", "FILE")
CUSTOMER_RELATION_TYPES = ("ISSUE", "USER")

_ALIVE = Q(deleted_at__isnull=True)


class Customer(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_customers")
    name = models.CharField(max_length=255)
    description = models.JSONField(default=dict, blank=True)
    description_html = models.TextField(default="<p></p>", blank=True)
    description_stripped = models.TextField(null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True)
    website_url = models.TextField(null=True, blank=True)
    logo_props = models.JSONField(default=dict, blank=True)
    logo_asset = models.ForeignKey(
        "db.FileAsset", on_delete=models.SET_NULL, null=True, blank=True, related_name="nexus_customer_logos"
    )
    # Shown as "Industry" in Plane's UI.
    domain = models.CharField(max_length=255, null=True, blank=True)
    employees = models.PositiveIntegerField(null=True, blank=True)
    stage = models.CharField(max_length=255, null=True, blank=True)
    contract_status = models.CharField(max_length=255, null=True, blank=True)
    revenue = models.CharField(max_length=255, null=True, blank=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "nexus_customers"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=["workspace", "name"], condition=_ALIVE, name="nexus_customer_unique_name"),
        ]


class CustomerProperty(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_customer_properties")
    # Slug of display_name, unique per workspace.
    name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    logo_props = models.JSONField(default=dict, blank=True)
    sort_order = models.FloatField(default=65535)
    property_type = models.CharField(max_length=32, choices=[(t, t) for t in CUSTOMER_PROPERTY_TYPES])
    relation_type = models.CharField(
        max_length=32, choices=[(t, t) for t in CUSTOMER_RELATION_TYPES], null=True, blank=True
    )
    is_required = models.BooleanField(default=False)
    default_value = models.JSONField(default=list, blank=True)
    settings = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    is_multi = models.BooleanField(default=False)
    validation_rules = models.JSONField(default=dict, blank=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "nexus_customer_properties"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"], condition=_ALIVE, name="nexus_customer_property_unique_name"
            ),
        ]


class CustomerPropertyOption(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="nexus_customer_property_options"
    )
    property = models.ForeignKey(CustomerProperty, on_delete=models.CASCADE, related_name="options")
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="children")
    name = models.CharField(max_length=255)
    sort_order = models.FloatField(default=65535)
    description = models.TextField(null=True, blank=True)
    logo_props = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "nexus_customer_property_options"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["property", "name"], condition=_ALIVE, name="nexus_customer_property_option_unique_name"
            ),
        ]


class CustomerPropertyValue(BaseModel):
    """One value of a property on a customer; a multi-value property has one row per value.

    `value` holds the wire string for every type (dates as YYYY-MM-DD, booleans as
    "True"/"False", options/relations/files as UUIDs).
    """

    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="nexus_customer_property_values"
    )
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="property_values")
    property = models.ForeignKey(CustomerProperty, on_delete=models.CASCADE, related_name="values")
    value = models.TextField()
    value_option = models.ForeignKey(
        CustomerPropertyOption, on_delete=models.CASCADE, null=True, blank=True, related_name="values"
    )
    sort_order = models.FloatField(default=65535)

    class Meta:
        db_table = "nexus_customer_property_values"
        ordering = ("sort_order", "created_at")
        indexes = [models.Index(fields=["customer", "property"], name="nexus_cust_prop_value_idx")]


class CustomerRequest(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_customer_requests")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="requests")
    name = models.CharField(max_length=255)
    description = models.JSONField(default=dict, blank=True)
    description_html = models.TextField(default="<p></p>", blank=True)
    description_stripped = models.TextField(null=True, blank=True)
    link = models.TextField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "nexus_customer_requests"
        ordering = ("-created_at",)


class CustomerWorkItem(BaseModel):
    """A work item linked to a customer, optionally through one of its requests."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_customer_work_items")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="work_item_links")
    customer_request = models.ForeignKey(
        CustomerRequest, on_delete=models.CASCADE, null=True, blank=True, related_name="work_item_links"
    )
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="nexus_customer_links")

    class Meta:
        db_table = "nexus_customer_work_items"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "issue"],
                condition=Q(deleted_at__isnull=True, customer_request__isnull=True),
                name="nexus_customer_work_item_unique_direct",
            ),
            models.UniqueConstraint(
                fields=["customer", "issue", "customer_request"],
                condition=Q(deleted_at__isnull=True, customer_request__isnull=False),
                name="nexus_customer_work_item_unique_request",
            ),
        ]
