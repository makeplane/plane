# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.ee.serializers import BaseSerializer
from plane.db.models import Page, ProjectPage
from plane.ee.models import Collection, PageCollection
from plane.utils.content_validator import validate_html_content


class PageDetailAPISerializer(BaseSerializer):
    anchor = serializers.CharField(read_only=True)
    description = serializers.JSONField(source="description_json", required=False, allow_null=True)

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description",
            "description_stripped",
            "description_json",
            "description_html",
            "description_binary",
            "created_at",
            "updated_at",
            "owned_by",
            "anchor",
            "workspace",
            "projects",
        ]
        read_only_fields = ["workspace", "owned_by", "anchor"]


class PageListAPISerializer(BaseSerializer):
    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "owned_by",
            "access",
            "is_locked",
            "archived_at",
            "workspace",
            "created_at",
            "updated_at",
            "logo_props",
            "parent_id",
        ]
        read_only_fields = ["workspace", "owned_by"]


class PageAPISerializer(BaseSerializer):
    anchor = serializers.CharField(read_only=True)

    class Meta:
        model = Page
        fields = "__all__"
        read_only_fields = ["workspace", "owned_by", "anchor"]


class PageCreateAPISerializer(BaseSerializer):
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
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "view_props",
            "logo_props",
            "external_id",
            "external_source",
            "parent_id",
            "description_html",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "owned_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "name": {"required": True, "allow_blank": False},
            "description_html": {"required": True, "allow_blank": False},
        }

    def validate_description_html(self, value):
        """Validate the HTML content for description_html using shared validator."""
        if not value:
            return value

        # Use the validation function from utils
        is_valid, error_message, sanitized_html = validate_html_content(value)
        if not is_valid:
            raise serializers.ValidationError(error_message)

        # Return sanitized HTML if available, otherwise return original
        return sanitized_html if sanitized_html is not None else value

    def create(self, validated_data):
        workspace_id = self.context["workspace_id"]
        project_id = self.context.get("project_id", None)
        owned_by_id = self.context["owned_by_id"]
        description_binary = self.context["description_binary"]
        description_json = self.context["description_json"]
        collection_id = self.context.get("collection_id", None)

        # Create the page
        page = Page.objects.create(
            **validated_data,
            owned_by_id=owned_by_id,
            workspace_id=workspace_id,
            description_binary=description_binary,
            description_json=description_json,
        )

        # Create the project page
        if project_id:
            ProjectPage.objects.create(
                workspace_id=page.workspace_id,
                project_id=project_id,
                page_id=page.id,
                created_by_id=page.created_by_id,
                updated_by_id=page.updated_by_id,
            )

        if not collection_id and page.parent_id:
            parent_collection_id = (
                PageCollection.objects.filter(page_id=page.parent_id, workspace_id=workspace_id)
                .values_list("collection_id", flat=True)
                .first()
            )
            if parent_collection_id:
                collection_id = parent_collection_id

        target_collection_id = None
        if collection_id and page.access == Page.PUBLIC_ACCESS:
            target_collection_id = collection_id
        elif page.access == Page.PUBLIC_ACCESS:
            default_collection = Collection.objects.filter(workspace_id=workspace_id, access=0, is_default=True).first()
            if default_collection:
                target_collection_id = default_collection.id

        if target_collection_id:
            PageCollection.objects.create(
                page=page,
                collection_id=target_collection_id,
                workspace_id=workspace_id,
                created_by_id=owned_by_id,
                updated_by_id=owned_by_id,
            )

        return page
