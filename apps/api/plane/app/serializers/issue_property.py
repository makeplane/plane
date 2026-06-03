# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from .base import BaseSerializer
from plane.db.models import (
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
)


class IssuePropertyOptionSerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyOption
        fields = [
            "id",
            "name",
            "description",
            "logo_props",
            "sort_order",
            "is_active",
            "is_default",
            "parent",
            "property",
            "project_id",
            "workspace_id",
            "external_source",
            "external_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace", "project", "property", "external_source", "external_id"]


class IssuePropertySerializer(BaseSerializer):
    options = IssuePropertyOptionSerializer(many=True, read_only=True)

    class Meta:
        model = IssueProperty
        fields = [
            "id",
            "name",
            "display_name",
            "description",
            "logo_props",
            "sort_order",
            "property_type",
            "relation_type",
            "is_required",
            "default_value",
            "settings",
            "is_active",
            "is_multi",
            "validation_rules",
            "issue_type",
            "project_id",
            "workspace_id",
            "options",
            "external_source",
            "external_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace", "project", "issue_type", "external_source", "external_id"]


class IssuePropertyValueSerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyValue
        fields = [
            "id",
            "issue",
            "property",
            "value_text",
            "value_boolean",
            "value_decimal",
            "value_datetime",
            "value_uuid",
            "value_option",
            "project_id",
            "workspace_id",
            "external_source",
            "external_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace", "project", "issue"]
