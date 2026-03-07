# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import transaction
from rest_framework import serializers

from plane.db.models import Label, Page, PageLabel, Project, ProjectPage

from .base import BaseSerializer


class PageSerializer(BaseSerializer):
    label_ids = serializers.ListField(child=serializers.UUIDField(), read_only=True)
    project_ids = serializers.ListField(child=serializers.UUIDField(), read_only=True)
    labels = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.none()),
        write_only=True,
        required=False,
    )

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
            "labels",
            "label_ids",
            "parent",
            "is_locked",
            "archived_at",
            "view_props",
            "logo_props",
            "project_ids",
            "workspace",
            "external_id",
            "external_source",
            "sort_order",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["workspace", "owned_by", "project_ids", "label_ids", "is_locked", "archived_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Scope label choices to the current workspace to prevent cross-workspace
        # label assignment.
        workspace_id = None
        project_id = self.context.get("project_id")
        if project_id:
            workspace_id = (
                Project.objects.filter(pk=project_id).values_list("workspace_id", flat=True).first()
            )
        elif self.instance:
            workspace_id = self.instance.workspace_id

        if workspace_id:
            self.fields["labels"].child = serializers.PrimaryKeyRelatedField(
                queryset=Label.objects.filter(workspace_id=workspace_id)
            )

    def create(self, validated_data):
        labels = validated_data.pop("labels", None)
        project_id = self.context["project_id"]
        owned_by_id = self.context["owned_by_id"]

        project = Project.objects.get(pk=project_id)

        with transaction.atomic():
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

    def update(self, instance, validated_data):
        labels = validated_data.pop("labels", None)
        with transaction.atomic():
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
