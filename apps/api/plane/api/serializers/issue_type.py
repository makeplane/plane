# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from django.db import transaction
from rest_framework import serializers

# Module imports
from plane.db.models import IssueType
from plane.db.models.issue_type import ProjectIssueType
from .base import BaseSerializer


class IssueTypeSerializer(BaseSerializer):
    """Serializer for project-scoped work item types."""

    # IssueType.level is FloatField in DB while the SDK contract requires int.
    level = serializers.IntegerField(required=False, min_value=0, max_value=2147483647, default=0)
    # Body project_ids other than the URL project are ignored on create/update
    # because CE work item types are project-scoped.
    project_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_null=True,
    )

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
            "project_ids",
            "external_source",
            "external_id",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at",
        ]
        read_only_fields = [
            "id",
            "is_default",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at",
        ]

    def validate(self, attrs):
        if attrs.get("is_epic") is True:
            raise serializers.ValidationError({"is_epic": "Epics are not available on this edition"})

        # Deactivating the default type would leave new work items without a valid type.
        if self.instance is not None and self.instance.is_default and attrs.get("is_active") is False:
            raise serializers.ValidationError({"is_active": "The default work item type cannot be deactivated"})

        return attrs

    def to_representation(self, instance):
        if not hasattr(instance, "project_ids") or instance.project_ids is None:
            instance.project_ids = list(
                ProjectIssueType.objects.filter(
                    issue_type=instance,
                    deleted_at__isnull=True,
                ).values_list("project_id", flat=True)
            )
        data = super().to_representation(instance)
        if "level" in data and data["level"] is not None:
            data["level"] = int(data["level"])
        return data

    def create(self, validated_data):
        validated_data.pop("project_ids", None)
        project = self.context["project"]
        level = int(validated_data.get("level", 0) or 0)
        validated_data["level"] = level
        issue_type = IssueType.objects.create(
            workspace_id=project.workspace_id,
            **validated_data,
        )
        ProjectIssueType.objects.create(
            project=project,
            workspace_id=project.workspace_id,
            issue_type=issue_type,
            level=level,
            is_default=issue_type.is_default,
        )
        issue_type.project_ids = [project.id]
        return issue_type

    def update(self, instance, validated_data):
        validated_data.pop("project_ids", None)
        if "level" in validated_data and validated_data["level"] is not None:
            validated_data["level"] = int(validated_data["level"])
        with transaction.atomic():
            instance = super().update(instance, validated_data)
            if "level" in validated_data and validated_data["level"] is not None and self.context.get("project_id"):
                ProjectIssueType.objects.filter(
                    project_id=self.context["project_id"],
                    issue_type=instance,
                ).update(level=int(validated_data["level"]))
        return instance


WorkItemTypeSerializer = IssueTypeSerializer
