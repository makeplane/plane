# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.db.models import Project, WorkItemTemplate, Workspace
from plane.utils.content_validator import validate_html_content
from plane.utils.work_item_template import (
    resolve_payload_for_project,
    sanitize_payload_for_scope,
    validate_payload,
)


class WorkItemTemplateSerializer(BaseSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.none(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = WorkItemTemplate
        fields = [
            "id",
            "name",
            "description",
            "payload",
            "project",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "sort_order", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        slug = self.context.get("slug")
        if slug is not None:
            self.fields["project"].queryset = Project.objects.filter(
                workspace__slug=slug, archived_at__isnull=True
            )

    def to_internal_value(self, data):
        if isinstance(data, dict) and "project_id" in data and "project" not in data:
            data = {**data, "project": data.get("project_id")}
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["project_id"] = str(instance.project_id) if instance.project_id else None
        if "project" in data:
            del data["project"]
        for_project = self.context.get("for_project")
        if for_project is not None:
            data["resolved_payload"] = resolve_payload_for_project(
                workspace_id=instance.workspace_id,
                project_id=for_project,
                raw=instance.payload or {},
            )
        return data

    def validate(self, attrs):
        slug = self.context.get("slug")
        workspace = Workspace.objects.get(slug=slug)

        name = attrs.get("name", getattr(self.instance, "name", None))
        if not name or not str(name).strip():
            raise serializers.ValidationError({"name": "Name is required"})

        project = attrs.get("project", getattr(self.instance, "project", None))
        if "project" in attrs and project is not None and project.workspace_id != workspace.id:
            raise serializers.ValidationError({"project": "Project must belong to the workspace"})

        if "payload" in attrs:
            raw_payload = attrs["payload"]
        else:
            raw_payload = self.instance.payload if self.instance else {}
        if raw_payload is None:
            raw_payload = {}

        if not isinstance(raw_payload, dict):
            raise serializers.ValidationError({"payload": "Payload must be an object"})

        if "description_html" in raw_payload and raw_payload["description_html"]:
            is_valid, _error_msg, sanitized_html = validate_html_content(str(raw_payload["description_html"]))
            if not is_valid:
                raise serializers.ValidationError({"payload": "description_html is not valid"})
            if sanitized_html is not None:
                raw_payload = {**raw_payload, "description_html": sanitized_html}

        strict_project = project is not None
        try:
            cleaned = validate_payload(
                workspace_id=workspace.id,
                project=project,
                data=raw_payload,
                strict_project=strict_project,
            )
        except ValueError as e:
            raise serializers.ValidationError({"payload": str(e)})

        if not strict_project:
            cleaned = sanitize_payload_for_scope(project=None, raw=cleaned)
        attrs["payload"] = cleaned
        attrs["name"] = str(name).strip()[:255]
        return attrs

    def create(self, validated_data):
        slug = self.context.get("slug")
        workspace = Workspace.objects.get(slug=slug)
        validated_data["workspace_id"] = workspace.id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "project" in validated_data:
            p = validated_data.get("project")
            if p is not None and p.workspace_id != instance.workspace_id:
                raise serializers.ValidationError({"project": "Project must belong to the workspace"})
        return super().update(instance, validated_data)
