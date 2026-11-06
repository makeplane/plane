# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Response shapes for work item types, properties, options, templates and relation
definitions, matching plane-sdk's WorkItemType, WorkItemProperty,
WorkItemPropertyOption, WorkItemTemplate and WorkItemRelationDefinition."""

from rest_framework import serializers

from plane.db.models import IssueType
from plane.nexus.models import (
    WorkItemProperty,
    WorkItemPropertyOption,
    WorkItemRelationDefinition,
    WorkItemTemplate,
)

OPTION_TYPES = ("OPTION", "CASCADING")


class WorkItemTypeSerializer(serializers.ModelSerializer):
    """plane-sdk WorkItemType. project_ids are the projects the type is imported into."""

    level = serializers.SerializerMethodField()
    project_ids = serializers.SerializerMethodField()

    class Meta:
        model = IssueType
        fields = [
            "id",
            "name",
            "description",
            "logo_props",
            "is_epic",
            "is_default",
            "is_active",
            "level",
            "external_source",
            "external_id",
            "project_ids",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at",
        ]
        read_only_fields = fields

    def get_level(self, obj) -> int:
        return int(obj.level or 0)

    def get_project_ids(self, obj) -> list[str]:
        # Prefetched as `linked_projects` by the views; a fallback query otherwise.
        links = getattr(obj, "linked_projects", None)
        if links is None:
            from plane.db.models.issue_type import ProjectIssueType

            links = ProjectIssueType.objects.filter(issue_type=obj, project__deleted_at__isnull=True)
        return [str(link.project_id) for link in links]


class WorkItemPropertyOptionSerializer(serializers.ModelSerializer):
    """plane-sdk WorkItemPropertyOption."""

    project = serializers.SerializerMethodField()

    class Meta:
        model = WorkItemPropertyOption
        fields = [
            "id",
            "name",
            "sort_order",
            "description",
            "logo_props",
            "is_active",
            "is_default",
            "external_source",
            "external_id",
            "workspace",
            "project",
            "property",
            "parent",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at",
        ]
        read_only_fields = fields

    def get_project(self, obj):
        # Options belong to the workspace catalogue, never to one project.
        return None


class WorkItemPropertySerializer(serializers.ModelSerializer):
    """plane-sdk WorkItemProperty.

    `issue_type` is the type the property was listed under (context `issue_type_id`),
    else the first type it is attached to. `issue_type_ids` lists them all.
    """

    project = serializers.SerializerMethodField()
    issue_type = serializers.SerializerMethodField()
    issue_type_ids = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()
    settings = serializers.SerializerMethodField()

    class Meta:
        model = WorkItemProperty
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
            "external_source",
            "external_id",
            "workspace",
            "project",
            "issue_type",
            "issue_type_ids",
            "options",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at",
        ]
        read_only_fields = fields

    def _type_ids(self, obj) -> list[str]:
        links = getattr(obj, "active_type_links", None)
        if links is None:
            links = obj.type_links.filter(issue_type__deleted_at__isnull=True)
        return [str(link.issue_type_id) for link in links]

    def get_project(self, obj):
        return None

    def get_issue_type(self, obj):
        if self.context.get("issue_type_id"):
            return str(self.context["issue_type_id"])
        ids = self._type_ids(obj)
        return ids[0] if ids else None

    def get_issue_type_ids(self, obj) -> list[str]:
        return self._type_ids(obj)

    def get_settings(self, obj):
        # The SDK parses settings as TextAttributeSettings | DateAttributeSettings | dict.
        return obj.settings or {}

    def get_options(self, obj):
        if obj.property_type not in OPTION_TYPES:
            return None
        return WorkItemPropertyOptionSerializer(obj.options.all(), many=True).data


class WorkItemTemplateSerializer(serializers.ModelSerializer):
    """plane-sdk WorkItemTemplate, both the workspace and the project shape.

    `project` is null for a workspace template. `description` repeats
    short_description for the workspace model, which reads that name.
    """

    description = serializers.CharField(source="short_description", read_only=True)

    class Meta:
        model = WorkItemTemplate
        fields = [
            "id",
            "name",
            "description",
            "description_html",
            "short_description",
            "template_data",
            "template_type",
            "logo_props",
            "project",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = fields


class WorkItemRelationDefinitionSerializer(serializers.ModelSerializer):
    """plane-sdk WorkItemRelationDefinition."""

    class Meta:
        model = WorkItemRelationDefinition
        fields = [
            "id",
            "name",
            "outward",
            "inward",
            "is_default",
            "is_active",
            "color",
            "sort_order",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = fields
