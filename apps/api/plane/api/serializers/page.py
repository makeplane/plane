# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Q
from rest_framework import serializers

from plane.app.serializers import PageSerializer
from plane.db.models import Page, ProjectPage
from plane.utils.content_validator import validate_html_content


class PageAPISerializer(PageSerializer):
    """Public API representation for a project Page.

    The app serializer already owns Page creation, project linking, and label
    updates. The public API adds the content fields that are otherwise handled
    by the browser-only description endpoint and preserves HTML byte-for-byte.
    """

    description_html = serializers.CharField(allow_blank=True, trim_whitespace=False)
    description_json = serializers.JSONField(read_only=True)

    class Meta(PageSerializer.Meta):
        fields = [
            "id",
            "name",
            "description_html",
            "description_json",
            "owned_by",
            "access",
            "color",
            "labels",
            "parent",
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
        ]
        read_only_fields = [
            "id",
            "workspace",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "archived_at",
            "is_locked",
        ]

    def validate_description_html(self, value):
        if not value:
            return value

        is_valid, error_message, sanitized_html = validate_html_content(value)
        if not is_valid:
            raise serializers.ValidationError(error_message)
        return sanitized_html

    def validate(self, attrs):
        attrs = super().validate(attrs)
        project_id = self.context["project_id"]
        workspace_slug = self.context["workspace_slug"]

        parent = attrs.get("parent")
        if parent:
            accessible_parent = ProjectPage.objects.filter(
                project_id=project_id,
                workspace__slug=workspace_slug,
                page=parent,
                deleted_at__isnull=True,
            ).filter(Q(page__owned_by_id=self.context["owned_by_id"]) | Q(page__access=Page.PUBLIC_ACCESS))
            if not accessible_parent.exists():
                raise serializers.ValidationError({"parent": "The parent page is not accessible in this project."})
            if self.instance:
                if parent.id == self.instance.id:
                    raise serializers.ValidationError({"parent": "A page cannot be its own parent."})

                ancestor_id = parent.parent_id
                visited_ids = {parent.id}
                while ancestor_id:
                    if ancestor_id == self.instance.id or ancestor_id in visited_ids:
                        raise serializers.ValidationError({"parent": "The parent would create a page cycle."})
                    visited_ids.add(ancestor_id)
                    ancestor_id = Page.objects.filter(pk=ancestor_id).values_list("parent_id", flat=True).first()

        labels = attrs.get("labels")
        if labels and any(label.project_id != project_id for label in labels):
            raise serializers.ValidationError({"labels": "All labels must belong to this project."})

        return attrs

    def create(self, validated_data):
        self.context["description_html"] = validated_data.pop("description_html")
        self.context["description_json"] = {}
        self.context["description_binary"] = None
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "description_html" in validated_data:
            # Plane Live treats a non-empty Yjs binary as authoritative. Clear
            # it so the next editor connection imports this PAT-authored HTML
            # instead of restoring and later persisting stale editor state.
            validated_data["description_binary"] = None
            validated_data["description_json"] = {}
        return super().update(instance, validated_data)
