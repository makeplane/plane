# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import Page, Project, ProjectPage
from plane.utils.content_validator import validate_html_content


class PageSerializer(BaseSerializer):
    """
    Serializer for pages with metadata fields.

    Handles page metadata (name, access, color, parent, lock and archive
    state) for list responses. Page content is exposed through
    PageDetailSerializer.
    """

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "access",
            "color",
            "parent",
            "is_locked",
            "archived_at",
            "workspace",
            "view_props",
            "logo_props",
            "external_id",
            "external_source",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        extra_kwargs = {"name": {"required": True, "allow_blank": False}}

    def validate_parent(self, value):
        # The parent page must belong to the same project
        project_id = self.context.get("project_id") or (
            self.instance and self.instance.project_pages.values_list("project_id", flat=True).first()
        )
        if value and project_id:
            if not ProjectPage.objects.filter(
                page_id=value.id, project_id=project_id, deleted_at__isnull=True
            ).exists():
                raise serializers.ValidationError("Parent page must belong to the same project")
        return value


class PageDetailSerializer(PageSerializer):
    """
    Extended page serializer including HTML content.

    Provides the full page representation with description_html for
    create, retrieve and update operations.
    """

    description_html = serializers.CharField(required=False)

    class Meta(PageSerializer.Meta):
        fields = PageSerializer.Meta.fields + ["description_html"]

    def validate_description_html(self, value):
        # Validate and sanitize the HTML content for security
        if value:
            is_valid, error_msg, sanitized_html = validate_html_content(value)
            if not is_valid:
                raise serializers.ValidationError("html content is not valid")
            if sanitized_html is not None:
                return sanitized_html
        return value

    def create(self, validated_data):
        project_id = self.context["project_id"]
        owned_by_id = self.context["owned_by_id"]

        # Get the workspace id from the project
        project = Project.objects.get(pk=project_id)

        # Create the page
        page = Page.objects.create(
            **validated_data,
            owned_by_id=owned_by_id,
            workspace_id=project.workspace_id,
        )

        # Create the project page
        ProjectPage.objects.create(
            workspace_id=page.workspace_id,
            project_id=project_id,
            page_id=page.id,
            created_by_id=page.created_by_id,
            updated_by_id=page.updated_by_id,
        )

        return page
