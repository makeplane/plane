# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import IssuePage, Page, Project, ProjectPage
from plane.utils.content_validator import validate_html_content


def _sanitize_description_html(value):
    if not value:
        return value
    is_valid, error_message, sanitized_html = validate_html_content(value)
    if not is_valid:
        raise serializers.ValidationError(error_message)
    return sanitized_html if sanitized_html is not None else value


class PageSerializer(BaseSerializer):
    """Public API serializer for project pages matching the Plane SDK Page contract."""

    description = serializers.JSONField(source="description_json", read_only=True)
    parent_id = serializers.UUIDField(read_only=True, allow_null=True)
    projects = serializers.SerializerMethodField()
    anchor = serializers.SerializerMethodField()
    collection_id = serializers.SerializerMethodField()
    page_collection_id = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description_html",
            "description_stripped",
            "description",
            "owned_by",
            "access",
            "color",
            "is_locked",
            "archived_at",
            "parent_id",
            "projects",
            "workspace",
            "view_props",
            "logo_props",
            "external_id",
            "external_source",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "anchor",
            "collection_id",
            "page_collection_id",
        ]
        read_only_fields = fields

    def get_projects(self, obj):
        if hasattr(obj, "project_ids") and obj.project_ids is not None:
            return [str(project_id) for project_id in obj.project_ids]
        return [
            str(project_id)
            for project_id in ProjectPage.objects.filter(page=obj, deleted_at__isnull=True).values_list(
                "project_id", flat=True
            )
        ]

    def get_anchor(self, obj):
        return None

    def get_collection_id(self, obj):
        return None

    def get_page_collection_id(self, obj):
        return None


class PageCreateSerializer(BaseSerializer):
    """Serializer for creating a project page."""

    name = serializers.CharField(required=True, allow_blank=False)
    description_html = serializers.CharField(required=True, allow_blank=False)
    access = serializers.ChoiceField(choices=Page.ACCESS_CHOICES, required=False, default=Page.PUBLIC_ACCESS)
    color = serializers.CharField(max_length=255, required=False, allow_blank=True)
    is_locked = serializers.BooleanField(required=False, default=False)
    view_props = serializers.JSONField(required=False)
    logo_props = serializers.JSONField(required=False)
    external_id = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    external_source = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    parent_id = serializers.UUIDField(required=False, allow_null=True)
    collection_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Page
        fields = [
            "name",
            "description_html",
            "access",
            "color",
            "is_locked",
            "view_props",
            "logo_props",
            "external_id",
            "external_source",
            "parent_id",
            "collection_id",
        ]

    def validate_description_html(self, value):
        return _sanitize_description_html(value)

    def validate_parent_id(self, value):
        if value is None:
            return None
        # Imported lazily: plane.api.views.page imports this module at load time.
        from plane.api.views.page import _project_pages_queryset

        parent_visible = (
            _project_pages_queryset(self.context["user"], self.context.get("slug"), self.context.get("project_id"))
            .filter(pk=value, archived_at__isnull=True)
            .exists()
        )
        if not parent_visible:
            raise serializers.ValidationError("Parent page must belong to the same project.")
        return value

    def validate_collection_id(self, value):
        if value is not None:
            raise serializers.ValidationError("Collections are not available on this edition")
        return value

    def create(self, validated_data):
        validated_data.pop("collection_id", None)
        parent_id = validated_data.pop("parent_id", None)
        project_id = self.context["project_id"]
        owned_by_id = self.context["owned_by_id"]

        project = Project.objects.get(pk=project_id, workspace__slug=self.context["slug"])
        with transaction.atomic():
            page = Page.objects.create(
                **validated_data,
                parent_id=parent_id,
                owned_by_id=owned_by_id,
                workspace_id=project.workspace_id,
            )
            ProjectPage.objects.create(
                workspace_id=page.workspace_id,
                project_id=project.id,
                page_id=page.id,
                created_by_id=page.created_by_id,
                updated_by_id=page.updated_by_id,
            )
        return page


class PageUpdateSerializer(BaseSerializer):
    """Serializer for updating a project page."""

    name = serializers.CharField(required=False, allow_blank=False)
    description_html = serializers.CharField(required=False, allow_blank=True)
    access = serializers.ChoiceField(choices=Page.ACCESS_CHOICES, required=False)
    color = serializers.CharField(max_length=255, required=False, allow_blank=True)
    is_locked = serializers.BooleanField(required=False)
    view_props = serializers.JSONField(required=False)
    logo_props = serializers.JSONField(required=False)
    external_id = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    external_source = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Page
        fields = [
            "name",
            "description_html",
            "access",
            "color",
            "is_locked",
            "view_props",
            "logo_props",
            "external_id",
            "external_source",
        ]

    def validate_description_html(self, value):
        return _sanitize_description_html(value)

    def update(self, instance, validated_data):
        if "description_html" in validated_data:
            # Clear Yjs binary and JSON state so the live collaboration service rebuilds from HTML.
            instance.description_binary = None
            instance.description_json = {}
        return super().update(instance, validated_data)


class PageLiteSerializer(BaseSerializer):
    """Nested lightweight page serializer used inside work item page links."""

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
            "created_by",
            "is_global",
            "logo_props",
        ]
        read_only_fields = fields


class IssuePageSerializer(BaseSerializer):
    """Public API serializer for work item to page links."""

    page = PageLiteSerializer(read_only=True)

    class Meta:
        model = IssuePage
        fields = [
            "id",
            "page",
            "issue",
            "project",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
        ]
        read_only_fields = fields


class IssuePageCreateSerializer(serializers.Serializer):
    """Serializer for linking a page to a work item."""

    page_id = serializers.UUIDField(required=True)
