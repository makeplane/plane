# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import transaction
from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import Page, ProjectPage
from plane.utils.content_validator import validate_html_content


class ProjectPageListSerializer(BaseSerializer):
    """Public metadata representation for a project Page collection."""

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "access",
            "color",
            "owned_by",
            "workspace",
            "parent",
            "is_locked",
            "archived_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class ProjectPageCreateSerializer(serializers.ModelSerializer):
    """Narrow public input boundary for creating a Page in one URL project."""

    class Meta:
        model = Page
        fields = ["name", "description_html", "access", "color"]
        extra_kwargs = {
            "name": {"required": True, "allow_blank": False, "trim_whitespace": True},
            "description_html": {"required": False, "allow_blank": True},
            "access": {"required": False},
            "color": {"required": False},
        }

    def validate(self, attrs):
        disallowed_fields = set(self.initial_data) - set(self.fields)
        if disallowed_fields:
            raise serializers.ValidationError(
                {field: "This field is not allowed." for field in sorted(disallowed_fields)}
            )

        description_html = attrs.get("description_html")
        if description_html:
            is_valid, error_message, sanitized_html = validate_html_content(description_html)
            if not is_valid:
                raise serializers.ValidationError({"description_html": error_message})
            attrs["description_html"] = sanitized_html or ""

        return attrs

    def create(self, validated_data):
        project = self.context["project"]
        user = self.context["user"]
        validated_data.setdefault("access", Page.PUBLIC_ACCESS)

        with transaction.atomic():
            page = Page.objects.create(
                **validated_data,
                workspace=project.workspace,
                owned_by=user,
            )
            ProjectPage.objects.create(workspace=project.workspace, project=project, page=page)

        return page
