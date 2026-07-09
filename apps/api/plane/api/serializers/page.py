# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Page

from .base import BaseSerializer


class PageSerializer(BaseSerializer):
    """External API (v1) serializer for pages (workspace wiki and project pages).

    ``name`` is required on creation. Ownership (``owned_by``) and the scoping
    relations (``workspace``, ``project_ids``, ``is_global``) are assigned
    server-side and are read-only for API clients. Output keys mirror the
    ``Page`` model of the public Plane Python SDK / MCP server.
    """

    name = serializers.CharField(required=True)
    owned_by = serializers.UUIDField(source="owned_by_id", read_only=True)
    workspace = serializers.UUIDField(source="workspace_id", read_only=True)
    parent = serializers.UUIDField(source="parent_id", read_only=True, allow_null=True)
    project_ids = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description_html",
            "access",
            "color",
            "is_locked",
            "is_global",
            "archived_at",
            "view_props",
            "logo_props",
            "owned_by",
            "parent",
            "workspace",
            "project_ids",
            "external_id",
            "external_source",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "is_global",
            "archived_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def get_project_ids(self, obj):
        return [project.id for project in obj.projects.all()]
