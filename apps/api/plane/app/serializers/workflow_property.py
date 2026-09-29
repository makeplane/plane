# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workflow custom-property serializers — spec §14, §17.

Mirrors the §17.1/§17.2 admin surface for property CRUD + value
write/read. Read serializers expose the canonical shape; write
serializers delegate to
``plane.services.workflow_properties.validators`` for the type-aware
checks so the API surface and the issue-create path use exactly the
same validation logic.

§14.4 — ENTITY_REFERENCE serialization keeps the structured
``{entity_type, entity_id}`` shape. Resolved display is exposed as a
separate field for clients that want to render the picker without a
second round-trip; it never replaces the canonical id.
"""

# Python imports
from typing import Optional

# Third Party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.db.models import (
    Issue,
    IssuePropertyValue,
    IssueType,
    IssueTypeProperty,
    WorkspaceProperty,
)
from plane.db.models.workflow_property import WorkflowPropertyType

from plane.services.workflow_properties import (
    coerce_property_value,
    display_entity,
    validate_config,
    validate_value,
)
from plane.services.workflow_properties.errors import (
    WorkflowPropertyInvalidConfig,
    WorkflowPropertyInvalidValue,
    WorkflowPropertyTypeImmutable,
)


# ---------------------------------------------------------------------------
# Read serializers
# ---------------------------------------------------------------------------


class WorkspacePropertyReadSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceProperty
        fields = [
            "id",
            "workspace",
            "name",
            "description",
            "property_type",
            "config",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class IssueTypePropertyReadSerializer(BaseSerializer):
    property_name = serializers.CharField(source="property.name", read_only=True)
    property_type = serializers.CharField(source="property.property_type", read_only=True)
    property_config = serializers.JSONField(source="property.config", read_only=True)

    class Meta:
        model = IssueTypeProperty
        fields = [
            "id",
            "issue_type",
            "property",
            "property_name",
            "property_type",
            "property_config",
            "is_required",
            "default_value",
            "sequence",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class IssuePropertyValueReadSerializer(BaseSerializer):
    property_name = serializers.CharField(source="property.name", read_only=True)
    property_type = serializers.CharField(source="property.property_type", read_only=True)
    property_config = serializers.JSONField(source="property.config", read_only=True)
    # §14.4 — resolved display string for ``ENTITY_REFERENCE``.
    # ``None`` when the reference is dangling or the provider has no
    # display function.
    display = serializers.SerializerMethodField()

    class Meta:
        model = IssuePropertyValue
        fields = [
            "id",
            "issue",
            "property",
            "property_name",
            "property_type",
            "property_config",
            "value_json",
            "display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_display(self, obj):
        if obj.property.property_type != WorkflowPropertyType.ENTITY_REFERENCE:
            return None
        value = obj.value_json or {}
        if not isinstance(value, dict):
            return None
        entity_type = value.get("entity_type")
        entity_id = value.get("entity_id")
        if not entity_type or not entity_id:
            return None
        return display_entity(entity_type, entity_id)


class IssuePropertyPayloadSerializer(serializers.Serializer):
    """Composite payload for the Work Item detail / form renderer.

    Returned by the §17 runtime endpoint. Mirrors the FE renderer
    contract from §30 P1.4 (form renderer + Work Item detail
    renderer).
    """

    id = serializers.CharField()
    property_id = serializers.CharField()
    name = serializers.CharField()
    property_type = serializers.CharField()
    config = serializers.JSONField()
    is_required = serializers.BooleanField()
    sequence = serializers.FloatField()
    value_json = serializers.JSONField(allow_null=True)


# ---------------------------------------------------------------------------
# Write serializers
# ---------------------------------------------------------------------------


class WorkspacePropertyCreateSerializer(BaseSerializer):
    """§17 — POST /workspaces/:slug/properties/."""

    class Meta:
        model = WorkspaceProperty
        fields = [
            "id",
            "name",
            "description",
            "property_type",
            "config",
            "is_active",
        ]
        read_only_fields = ["id"]

    def validate_property_type(self, value: str) -> str:
        if value not in dict(WorkflowPropertyType.choices):
            raise serializers.ValidationError(
                f"Unknown property_type: {value}"
            )
        return value

    def validate_config(self, value):
        # ``property_type`` is validated first; ``to_internal_value`` runs
        # fields in declaration order so we know it is available.
        property_type = self.initial_data.get("property_type")
        try:
            validate_config(value, property_type)
        except WorkflowPropertyInvalidConfig as exc:
            raise serializers.ValidationError(exc.to_payload())
        return value

    def validate_name(self, value: str) -> str:
        workspace_id = self.context.get("workspace_id")
        if not workspace_id:
            return value
        qs = WorkspaceProperty.objects.filter(
            workspace_id=workspace_id, name=value
        )
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A property with this name already exists in the workspace."
            )
        return value


class WorkspacePropertyUpdateSerializer(WorkspacePropertyCreateSerializer):
    """PATCH serializer — ``property_type`` is immutable post-create.

    ``property_type`` is dropped from ``Meta.fields`` so DRF silently
    discards it on deserialise; this is the §14.4 "do not break the
    type contract" rule surfaced as an implicit no-op rather than a
    400. Attempting to remove the field from the writable shape keeps
    consumers from accidentally relying on it.
    """

    class Meta(WorkspacePropertyCreateSerializer.Meta):
        fields = [
            "id",
            "name",
            "description",
            "config",
            "is_active",
        ]
        read_only_fields = ["id"]

    def validate_config(self, value):
        # When patching, ``property_type`` comes from the existing
        # instance — callers cannot change it.
        property_type = (
            self.instance.property_type if self.instance else None
        )
        try:
            validate_config(value, property_type)
        except WorkflowPropertyInvalidConfig as exc:
            raise serializers.ValidationError(exc.to_payload())
        return value


class IssueTypePropertyWriteSerializer(BaseSerializer):
    """§14.3 — POST /issue-types/:type_id/properties/."""

    property_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkspaceProperty.objects.all(),
        write_only=True,
    )

    class Meta:
        model = IssueTypeProperty
        fields = [
            "id",
            "property_id",
            "is_required",
            "default_value",
            "sequence",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        project_id = self.context.get("project_id")
        issue_type_id = self.context.get("issue_type_id")
        if not project_id or not issue_type_id:
            raise serializers.ValidationError(
                "Project / issue type context missing."
            )
        property_obj = attrs["property_id"]
        # Property must belong to the same workspace as the project.
        project = self.context.get("project")
        if project is not None and property_obj.workspace_id != project.workspace_id:
            raise serializers.ValidationError(
                "Property must belong to the project's workspace."
            )
        if IssueTypeProperty.objects.filter(
            project_id=project_id,
            issue_type_id=issue_type_id,
            property=property_obj,
        ).exists():
            raise serializers.ValidationError(
                "Property is already attached to this issue type."
            )
        if attrs.get("default_value") is not None:
            try:
                validate_value(
                    attrs["default_value"],
                    property_obj.property_type,
                    property_obj.config or {},
                )
            except WorkflowPropertyInvalidValue as exc:
                raise serializers.ValidationError(exc.to_payload())
        attrs["property"] = property_obj
        attrs["issue_type_id"] = issue_type_id
        attrs.pop("property_id", None)
        return attrs


class IssueTypePropertyUpdateSerializer(IssueTypePropertyWriteSerializer):
    property_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkspaceProperty.objects.all(),
        required=False,
    )

    class Meta(IssueTypePropertyWriteSerializer.Meta):
        fields = [
            "id",
            "property_id",
            "is_required",
            "default_value",
            "sequence",
        ]
        read_only_fields = ["id"]


class IssuePropertyValueWriteSerializer(BaseSerializer):
    """§14 — PATCH /issues/:issue_id/property-values/.

    The wire shape is ``{property_id, value_json}`` per property. The
    bulk PATCH endpoint accepts a list of those payloads and applies
    them in a single transaction so the required-property check sees
    the post-write state.
    """

    property_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkspaceProperty.objects.all(),
        write_only=True,
    )
    # ``property`` is the FK on the model. The wire format supplies
    # ``property_id``; we resolve ``property`` from that and ignore
    # the field otherwise (it stays read-only on read).
    property = serializers.PrimaryKeyRelatedField(
        queryset=WorkspaceProperty.objects.all(),
        required=False,
    )
    value_json = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = IssuePropertyValue
        fields = [
            "id",
            "property",
            "property_id",
            "value_json",
        ]
        read_only_fields = ["id", "property"]

    def validate(self, attrs):
        property_obj = attrs.get("property_id") or attrs.get("property")
        if property_obj is None:
            raise serializers.ValidationError(
                {"property_id": "This field is required."}
            )
        attrs["property"] = property_obj
        attrs.pop("property_id", None)
        if "value_json" in attrs:
            # Coercion only — type validation lives in
            # ``persist_property_values`` so a type mismatch returns
            # the §14 ``WORKFLOW_PROPERTY_INVALID_VALUE`` envelope
            # with HTTP 422 (instead of DRF's default 400). Coercion
            # is best-effort: ``coerce_property_value`` returns the
            # original value untouched when it cannot normalise, so a
            # bad shape flows through to the service validator.
            value = coerce_property_value(attrs["value_json"], property_obj.property_type)
            attrs["value_json"] = value
        return attrs
