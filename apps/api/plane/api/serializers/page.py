# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import (
    Label,
    Page,
    PageLabel,
    Project,
    ProjectPage,
)


class PageCreateSerializer(BaseSerializer):
    """
    Serializer for creating pages within a project.

    Handles page creation including label assignment, parent page validation,
    and project-page link creation for project documentation setup.
    """

    labels = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.all()),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Page
        fields = [
            "name",
            "description_html",
            "description_json",
            "access",
            "color",
            "labels",
            "parent",
            "is_locked",
            "archived_at",
            "view_props",
            "logo_props",
            "external_id",
            "external_source",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "owned_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]

    def validate(self, data):
        project_id = self.context.get("project_id")
        if not project_id:
            raise serializers.ValidationError("Project ID is required")
        project = Project.objects.get(id=project_id)
        if not project:
            raise serializers.ValidationError("Project not found")

        # Validate the parent page belongs to the same project
        parent = data.get("parent", None)
        if parent is not None and not ProjectPage.objects.filter(
            project_id=project_id,
            page_id=parent.id,
            deleted_at__isnull=True,
        ).exists():
            raise serializers.ValidationError({"parent": "Parent page does not exist in this project"})

        return data

    def create(self, validated_data):
        labels = validated_data.pop("labels", None)

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

        # Create page labels
        if labels is not None:
            PageLabel.objects.bulk_create(
                [
                    PageLabel(
                        label=label,
                        page=page,
                        workspace_id=page.workspace_id,
                        created_by_id=page.created_by_id,
                        updated_by_id=page.updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )
        return page


class PageUpdateSerializer(PageCreateSerializer):
    """
    Serializer for updating pages with label management.

    Extends page creation with update-specific label replacement
    and parent page revalidation for documentation maintenance.
    """

    class Meta(PageCreateSerializer.Meta):
        model = Page
        fields = PageCreateSerializer.Meta.fields
        read_only_fields = PageCreateSerializer.Meta.read_only_fields

    def validate(self, data):
        project_id = self.context.get("project_id")
        if not project_id:
            raise serializers.ValidationError("Project ID is required")

        # Validate the parent page belongs to the same project
        parent = data.get("parent", None)
        if parent is not None and not ProjectPage.objects.filter(
            project_id=project_id,
            page_id=parent.id,
            deleted_at__isnull=True,
        ).exists():
            raise serializers.ValidationError({"parent": "Parent page does not exist in this project"})

        return data

    def update(self, instance, validated_data):
        labels = validated_data.pop("labels", None)
        if labels is not None:
            PageLabel.objects.filter(page=instance).delete()
            PageLabel.objects.bulk_create(
                [
                    PageLabel(
                        label=label,
                        page=instance,
                        workspace_id=instance.workspace_id,
                        created_by_id=instance.created_by_id,
                        updated_by_id=instance.updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        return super().update(instance, validated_data)


class PageSerializer(BaseSerializer):
    """
    Comprehensive page serializer with labels and project associations.

    Provides complete page data including content, hierarchy, label ids,
    and linked project ids for project documentation management.
    """

    # Many to many, annotated on the queryset
    label_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description_html",
            "description_json",
            "description_stripped",
            "owned_by",
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
            "label_ids",
            "project_ids",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "owned_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]
