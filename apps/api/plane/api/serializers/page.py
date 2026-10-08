# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction
from django.shortcuts import get_object_or_404

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import Page, ProjectPage, Project


class PageSerializer(BaseSerializer):
    """
    Serializer for project pages.

    Handles creation of a Page along with its ProjectPage join row so the
    public API can create, list, retrieve and update pages scoped to a
    project. Labels and revisions are not exposed in the MVP serializer.
    """

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description_html",
            "description_json",
            "owned_by",
            "access",
            "color",
            "parent",
            "is_locked",
            "archived_at",
            "view_props",
            "logo_props",
            "sort_order",
            "external_id",
            "external_source",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "owned_by",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def validate_parent(self, value):
        if value is None:
            return value
        project_id = self.context.get("project_id")
        if project_id and not ProjectPage.objects.filter(
            page_id=value.id,
            project_id=project_id,
            deleted_at__isnull=True,
        ).exists():
            raise serializers.ValidationError(
                "Parent page must belong to the same project."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        project_id = self.context["project_id"]
        owned_by_id = self.context["owned_by_id"]

        project = get_object_or_404(Project, pk=project_id)

        page = Page.objects.create(
            **validated_data,
            owned_by_id=owned_by_id,
            workspace_id=project.workspace_id,
        )

        ProjectPage.objects.create(
            workspace_id=page.workspace_id,
            project_id=project_id,
            page_id=page.id,
            created_by_id=page.created_by_id,
            updated_by_id=page.updated_by_id,
        )

        return page
