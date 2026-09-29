# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Work Item custom-property models — spec §14.

This module owns the §14 data model: workspace-scoped property catalog,
``(issue_type, property)`` association with required/default/sequence
metadata, and per-issue values. The schema is deliberately generic
(one ``value_json`` column with type-aware validation at the service
layer) so adding a new property type does not require a migration.

§14.1 — extend, do not replace, ``IssueType``. ``IssueType`` is reused
as-is; the new ``IssueTypeProperty`` row is purely additive (§14.3
proposed model).

§14.2 — the Portal MVP property types are enumerated in
``WorkflowPropertyType``. The two richer types
(``RICH_TEXT``/``FORMULA``) are explicitly deferred to a later phase
(§14.2 "Later:").

§14.4 — ``ENTITY_REFERENCE`` is structured (``{entity_type, entity_id}``)
and validated against a pluggable provider registry at the service
layer, never a free-text fallback.
"""

# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from .base import BaseModel
from .project import ProjectBaseModel


# ---------------------------------------------------------------------------
# Enum-like choice sets
# ---------------------------------------------------------------------------


class WorkflowPropertyType(models.TextChoices):
    """§14.2 — the Portal MVP property types.

    The two richer types (``RICH_TEXT``/``FORMULA``) are deferred —
    adding them now would lock us into an editor surface we haven't
    designed yet (§4 forbids formula/computed properties in P1).
    """

    TEXT = "TEXT", "Text"
    PARAGRAPH = "PARAGRAPH", "Paragraph"
    NUMBER = "NUMBER", "Number"
    BOOLEAN = "BOOLEAN", "Boolean"
    DATE = "DATE", "Date"
    DATETIME = "DATETIME", "Datetime"
    DROPDOWN = "DROPDOWN", "Dropdown"
    MULTI_SELECT = "MULTI_SELECT", "Multi-select"
    MEMBER = "MEMBER", "Member"
    URL = "URL", "URL"
    EMAIL = "EMAIL", "Email"
    ENTITY_REFERENCE = "ENTITY_REFERENCE", "Entity reference"


# Type-specific config validation is enforced at the service layer.
# ``config`` is JSON so each property type can carry its own options
# (DROPDOWN choices, MULTI_SELECT choices, ENTITY_REFERENCE
# entity_type allowlist, etc.) without a schema migration per option.
# See ``plane.services.workflow_properties.validators.validate_config``.

JSON_SCALAR_TYPES = frozenset(
    {
        WorkflowPropertyType.TEXT,
        WorkflowPropertyType.PARAGRAPH,
        WorkflowPropertyType.NUMBER,
        WorkflowPropertyType.BOOLEAN,
        WorkflowPropertyType.DATE,
        WorkflowPropertyType.DATETIME,
        WorkflowPropertyType.URL,
        WorkflowPropertyType.EMAIL,
    }
)

JSON_LIST_TYPES = frozenset(
    {
        WorkflowPropertyType.MULTI_SELECT,
        WorkflowPropertyType.MEMBER,
    }
)

JSON_OBJECT_TYPES = frozenset(
    {
        WorkflowPropertyType.ENTITY_REFERENCE,
    }
)


# ---------------------------------------------------------------------------
# §14.3 WorkspaceProperty
# ---------------------------------------------------------------------------


class WorkspaceProperty(BaseModel):
    """A workspace-scoped property definition.

    A property is *defined* at workspace scope (§14.3) and then
    *attached* to one or more Work Item types via ``IssueTypeProperty``.
    Soft-delete + the partial-unique below guarantee the same name can
    be reused after deletion without conflict.

    ``property_type`` is immutable post-create. Changing the type would
    invalidate every value already stored against this property and is
    rejected at the service layer to keep the §14.4 contract intact.
    """

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workflow_properties",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    property_type = models.CharField(
        max_length=32,
        choices=WorkflowPropertyType.choices,
    )
    # ``config`` is type-specific JSON. Validated by
    # ``plane.services.workflow_properties.validators.validate_config``
    # against ``property_type`` at write time.
    config = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Workspace Property"
        verbose_name_plural = "Workspace Properties"
        db_table = "workspace_properties"
        ordering = ("-created_at",)
        indexes = [
            # §27 lookup pattern: list active properties in a workspace
            # (and filter by type for the issue-type editor).
            models.Index(
                fields=["workspace", "is_active"],
                name="wf_workspace_props_active_idx",
            ),
        ]
        constraints = [
            # property name unique per workspace among non-deleted rows
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="workspace_properties_unique_workspace_name",
            ),
        ]

    def __str__(self):
        return f"{self.name} <{self.property_type}>"


# ---------------------------------------------------------------------------
# §14.3 IssueTypeProperty
# ---------------------------------------------------------------------------


class IssueTypeProperty(ProjectBaseModel):
    """Attaches a workspace property to a Work Item type.

    The combination ``(issue_type, property)`` is unique among
    non-deleted rows so a property cannot be attached twice to the same
    type. Soft-deletion preserves that the original attachment once
    existed — the unique name is part of the API contract for
    idempotent re-attaches.

    ``is_required`` drives §30 P1.4 server-side validation on create
    AND on transition. ``default_value`` is a JSON literal in the
    property's own shape; type-mismatch against ``property.property_type``
    is enforced at the service layer.
    """

    issue_type = models.ForeignKey(
        "db.IssueType",
        on_delete=models.CASCADE,
        related_name="workflow_properties",
    )
    property = models.ForeignKey(
        "db.WorkspaceProperty",
        on_delete=models.CASCADE,
        related_name="type_associations",
    )
    is_required = models.BooleanField(default=False)
    # ``default_value`` is a JSON literal shaped like a single value
    # for this property (string / number / list / {entity_type,...}).
    default_value = models.JSONField(default=None, null=True, blank=True)
    sequence = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Issue Type Property"
        verbose_name_plural = "Issue Type Properties"
        db_table = "issue_type_properties"
        ordering = ("sequence",)
        indexes = [
            # §27 lookup: load the active properties for a type in a
            # single query (the form renderer does this).
            models.Index(
                fields=["issue_type", "is_required"],
                name="wf_issue_type_props_lookup_idx",
            ),
        ]
        constraints = [
            # one attachment per (issue_type, property) among non-deleted
            models.UniqueConstraint(
                fields=["issue_type", "property"],
                condition=Q(deleted_at__isnull=True),
                name="issue_type_properties_unique_issue_type_property",
            ),
        ]

    def __str__(self):
        return f"{self.issue_type.name} → {self.property.name}"


# ---------------------------------------------------------------------------
# §14.3 IssuePropertyValue
# ---------------------------------------------------------------------------


class IssuePropertyValue(ProjectBaseModel):
    """Stores the typed value of a property for a single Work Item.

    One row per ``(issue, property)`` — the service layer enforces this
    via the partial-unique below. ``value_json`` carries the typed
    payload (string, number, list, ``{entity_type, entity_id}``,
    etc.) and is validated against ``property.property_type`` at write
    time by
    ``plane.services.workflow_properties.validators.validate_value``.

    ``TEXT`` / ``PARAGRAPH`` values may be large; we store them in
    JSON anyway (Postgres jsonb) so the table can grow without a
    ``TextField`` length migration, and so the value column has a
    single shape regardless of type.
    """

    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="workflow_property_values",
    )
    property = models.ForeignKey(
        "db.WorkspaceProperty",
        on_delete=models.CASCADE,
        related_name="issue_values",
    )
    value_json = models.JSONField(default=None, null=True, blank=True)

    class Meta:
        verbose_name = "Issue Property Value"
        verbose_name_plural = "Issue Property Values"
        db_table = "issue_property_values"
        ordering = ("-created_at",)
        indexes = [
            # §27 lookup: form/detail renderer hydrates all values for
            # an issue in one query.
            models.Index(
                fields=["issue"],
                name="wf_issue_prop_val_issue_idx",
            ),
        ]
        constraints = [
            # one value per (issue, property) among non-deleted rows —
            # the table is a key/value store keyed on the pair.
            models.UniqueConstraint(
                fields=["issue", "property"],
                condition=Q(deleted_at__isnull=True),
                name="issue_property_values_unique_issue_property",
            ),
        ]

    def __str__(self):
        return f"{self.issue_id}:{self.property_id}"
