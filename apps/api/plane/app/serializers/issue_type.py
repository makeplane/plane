# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.db.models import IssueType, IssueTypeProperty, Project, ProjectIssueType, Workspace
from plane.utils.issue_type_property import clean_property_list


class IssueTypePropertySerializer(BaseSerializer):
    class Meta:
        model = IssueTypeProperty
        fields = [
            "id",
            "title",
            "description",
            "property_type",
            "is_mandatory",
            "is_active",
            "sort_order",
            "options",
            "select_mode",
            "default_value",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "sort_order", "created_at", "updated_at"]


class IssueTypeSerializer(BaseSerializer):
    properties = serializers.SerializerMethodField()
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False, write_only=True)

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
            "properties",
            "project_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "properties"]

    def get_properties(self, instance):
        props = IssueTypeProperty.objects.filter(issue_type=instance, deleted_at__isnull=True).order_by(
            "sort_order", "created_at"
        )
        return IssueTypePropertySerializer(props, many=True).data

    def _raw_properties_from_request(self):
        if not isinstance(self.initial_data, dict):
            return None
        return self.initial_data.get("properties")

    def validate_name(self, value):
        name = str(value or "").strip()
        if not name:
            raise serializers.ValidationError("Name is required")
        slug = self.context.get("slug")
        if not slug:
            return name[:255]
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            raise serializers.ValidationError("Workspace not found")
        qs = IssueType.objects.filter(workspace_id=workspace.id, name__iexact=name, deleted_at__isnull=True)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("An issue type with this name already exists")
        return name[:255]

    def _sync_properties(self, issue_type: IssueType, raw_properties):
        if raw_properties is None:
            return
        try:
            cleaned_rows = clean_property_list(raw_properties)
        except ValueError as exc:
            raise serializers.ValidationError({"properties": str(exc)})

        existing = {
            str(row.id): row
            for row in IssueTypeProperty.objects.filter(issue_type=issue_type, deleted_at__isnull=True)
        }
        seen_ids = set()

        for idx, row in enumerate(cleaned_rows):
            prop_id = row.get("id")
            parsed_id = None
            if prop_id:
                try:
                    parsed_id = uuid.UUID(str(prop_id))
                except (ValueError, TypeError, AttributeError):
                    parsed_id = None

            payload = {
                "title": row["title"],
                "description": row.get("description", ""),
                "property_type": row["property_type"],
                "is_mandatory": row.get("is_mandatory", False),
                "is_active": row.get("is_active", True),
                "options": row.get("options", []),
                "select_mode": row.get("select_mode", "single"),
                "default_value": row.get("default_value"),
                "sort_order": (idx + 1) * 10000,
            }

            if parsed_id and str(parsed_id) in existing:
                obj = existing[str(parsed_id)]
                for key, val in payload.items():
                    setattr(obj, key, val)
                obj.save()
                seen_ids.add(str(parsed_id))
            else:
                IssueTypeProperty.objects.create(
                    workspace_id=issue_type.workspace_id,
                    issue_type=issue_type,
                    **payload,
                )

        for key, obj in existing.items():
            if key not in seen_ids:
                obj.delete()

    def _sync_project_links(self, issue_type: IssueType, project_ids):
        if project_ids is None:
            return
        slug = self.context.get("slug")
        workspace = Workspace.objects.get(slug=slug)
        valid_ids = set(
            str(pid)
            for pid in Project.objects.filter(
                workspace_id=workspace.id,
                id__in=project_ids,
                archived_at__isnull=True,
                deleted_at__isnull=True,
            ).values_list("id", flat=True)
        )
        existing = {
            str(row.project_id): row
            for row in ProjectIssueType.objects.filter(issue_type=issue_type, deleted_at__isnull=True)
        }
        for pid in valid_ids:
            if pid not in existing:
                ProjectIssueType.objects.create(
                    project_id=pid,
                    issue_type=issue_type,
                    workspace_id=issue_type.workspace_id,
                    level=issue_type.level,
                    is_default=issue_type.is_default,
                )
        for pid, row in existing.items():
            if pid not in valid_ids:
                row.delete()

    def create(self, validated_data):
        properties = self._raw_properties_from_request()
        project_ids = validated_data.pop("project_ids", None)
        slug = self.context.get("slug")
        workspace = Workspace.objects.get(slug=slug)
        validated_data["workspace_id"] = workspace.id
        if validated_data.get("logo_props") is None:
            validated_data["logo_props"] = {}
        issue_type = super().create(validated_data)
        if properties is not None:
            self._sync_properties(issue_type, properties)
        if project_ids is not None:
            self._sync_project_links(issue_type, project_ids)
        return issue_type

    def update(self, instance, validated_data):
        properties = self._raw_properties_from_request()
        project_ids = validated_data.pop("project_ids", None)
        issue_type = super().update(instance, validated_data)
        if properties is not None:
            self._sync_properties(issue_type, properties)
        if project_ids is not None:
            self._sync_project_links(issue_type, project_ids)
        return issue_type

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["project_ids"] = list(
            ProjectIssueType.objects.filter(issue_type=instance, deleted_at__isnull=True).values_list(
                "project_id", flat=True
            )
        )
        return data


class ProjectIssueTypeSerializer(BaseSerializer):
    issue_type_detail = IssueTypeSerializer(source="issue_type", read_only=True)

    class Meta:
        model = ProjectIssueType
        fields = [
            "id",
            "issue_type",
            "issue_type_detail",
            "level",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["issue_type_id"] = str(instance.issue_type_id)
        if "issue_type" in data:
            del data["issue_type"]
        return data
