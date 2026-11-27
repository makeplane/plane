# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Based on makeplane/plane#9528 (RemoYukoff), with the content reset from #9774 (rclod).

# Django imports
from django.db import transaction

# Third party imports
from rest_framework import serializers

# Module imports
from plane.api.serializers.base import BaseSerializer
from plane.db.models import Page, Project, ProjectPage
from plane.liviere.pages import api_changes_blocked
from plane.utils.content_validator import validate_html_content

# Fields a client may write; everything else (owner, workspace, archive state,
# Yjs binary) is set by the server.
WRITABLE_FIELDS = {
    "name",
    "description_html",
    "access",
    "color",
    "is_locked",
    "parent_id",
    "external_id",
    "external_source",
}


class PageSerializer(BaseSerializer):
    """
    Page metadata for list responses, shaped like the `Page` model of plane-sdk.

    Content (description_html) is only exposed by PageDetailSerializer.
    """

    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent",
        queryset=Page.objects.all(),
        required=False,
        allow_null=True,
    )
    projects = serializers.SerializerMethodField()
    # Set in the app (page menu: Block API changes); when true the API refuses every change
    api_changes_blocked = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
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
            "api_changes_blocked",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "owned_by",
            "archived_at",
            "workspace",
            "view_props",
            "logo_props",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        extra_kwargs = {"name": {"required": True, "allow_blank": False}}

    def get_api_changes_blocked(self, obj):
        return api_changes_blocked(obj)

    def get_projects(self, obj):
        project_pages = getattr(obj, "active_project_pages", None)
        if project_pages is None:
            project_pages = obj.project_pages.filter(deleted_at__isnull=True)
        return [str(project_page.project_id) for project_page in project_pages]

    def validate_parent_id(self, value):
        if value is None:
            return value

        # Reject the page itself and any of its descendants to avoid cycles;
        # track visited ids so a pre-existing cycle in the chain cannot loop forever
        if self.instance:
            visited = set()
            ancestor = value
            while ancestor is not None:
                if ancestor.id == self.instance.id:
                    raise serializers.ValidationError("Parent page cannot be the page itself or one of its descendants")
                if ancestor.id in visited:
                    raise serializers.ValidationError("Parent page hierarchy contains a cycle")
                visited.add(ancestor.id)
                ancestor = ancestor.parent

        # The parent must be a page of the same project that the requester can see
        user_id = self.context.get("user_id")
        if not ProjectPage.objects.filter(
            page_id=value.id,
            project_id=self.context["project_id"],
            deleted_at__isnull=True,
        ).exists() or (value.access == Page.PRIVATE_ACCESS and value.owned_by_id != user_id):
            raise serializers.ValidationError("Parent page must be a page of the same project")
        return value


class PageDetailSerializer(PageSerializer):
    """
    Full page including HTML content, used for create, retrieve and update.

    The editor reads the Yjs binary (description_binary), which the live server
    rebuilds from description_html only when it is empty. Pages without a binary
    get their HTML written and the binary stays empty; for pages with a binary the
    view passes the editor state computed by live (see views.PageDetailAPIEndpoint).
    """

    description_html = serializers.CharField(required=False, allow_blank=True)

    class Meta(PageSerializer.Meta):
        fields = PageSerializer.Meta.fields + ["description_html", "description_stripped"]
        read_only_fields = PageSerializer.Meta.read_only_fields + ["description_stripped"]

    def validate_description_html(self, value):
        if not value.strip():
            return "<p></p>"
        # Same validation and sanitization as the internal description endpoint
        is_valid, error_msg, sanitized_html = validate_html_content(value)
        if not is_valid:
            raise serializers.ValidationError(error_msg or "html content is not valid")
        if sanitized_html is not None:
            return sanitized_html
        return value

    def create(self, validated_data):
        project = Project.objects.get(pk=self.context["project_id"])
        owned_by_id = self.context["user_id"]

        with transaction.atomic():
            page = Page.objects.create(
                **validated_data,
                description_binary=None,
                description_json={},
                owned_by_id=owned_by_id,
                workspace_id=project.workspace_id,
            )
            ProjectPage.objects.create(
                workspace_id=project.workspace_id,
                project_id=project.id,
                page_id=page.id,
            )
        return page

    def update(self, instance, validated_data):
        # New HTML without an editor state from live: the page has no Yjs document yet, so the live
        # server rebuilds it from description_html on first open
        if "description_html" in validated_data and "description_binary" not in validated_data:
            instance.description_binary = None
            instance.description_json = {}
        return super().update(instance, validated_data)
