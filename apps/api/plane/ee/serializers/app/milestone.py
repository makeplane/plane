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
from django.db import IntegrityError
from rest_framework import serializers

# Module imports
from plane.app.serializers import BaseSerializer
from plane.ee.models import Milestone, MilestoneIssue
from plane.db.models import Issue
from plane.ee.serializers.app.description import DescriptionSerializer


class MilestoneWorkItemResponseSerializer(BaseSerializer):
    # Many to many
    label_ids = serializers.SerializerMethodField()
    assignee_ids = serializers.SerializerMethodField()
    type_id = serializers.UUIDField(source="type.id", read_only=True)
    is_epic = serializers.SerializerMethodField()

    def get_label_ids(self, obj):
        return [label.label_id for label in obj.label_issue.all()]

    def get_assignee_ids(self, obj):
        return [assignee.assignee_id for assignee in obj.issue_assignee.all()]

    def get_is_epic(self, obj):
        """Return True if the work item is an epic based on its type."""
        if hasattr(obj, "type") and obj.type:
            return obj.type.is_epic
        return False

    class Meta:
        model = Issue
        fields = [
            "id",
            "name",
            "state_id",
            "priority",
            "start_date",
            "target_date",
            "sequence_id",
            "project_id",
            "label_ids",
            "assignee_ids",
            "type_id",
            "is_epic",
        ]
        read_only_fields = fields


class MilestoneWorkItemSerializer(serializers.Serializer):
    """
    Serializer for managing work items in a milestone.

    Handles adding/removing work items using diff-based approach
    following the pattern from IssueSerializer (lines 277-312).
    """

    work_item_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Issue.objects.values_list("id", flat=True)),
        required=True,
    )

    def update(self, instance, validated_data):
        """
        Update milestone work items using diff-based approach.
        """
        work_item_ids = validated_data.get("work_item_ids", [])

        workspace_id = instance.workspace_id
        project_id = instance.project_id
        created_by_id = instance.created_by_id

        # Get updated_by from request context, fallback to created_by
        request = self.context.get("request")
        updated_by_id = request.user.id if request and request.user else created_by_id

        # Store for activity logging in view
        self.work_items_to_add = []
        self.work_items_to_remove = []

        # Validate work items exist and belong to same project
        # Filter to only valid work items (following pattern from IssueSerializer)
        work_item_ids = list(
            Issue.objects.filter(
                project_id=project_id,
                id__in=work_item_ids,
                deleted_at__isnull=True,
                archived_at__isnull=True,
            ).values_list("id", flat=True)
        )

        # Get the current work items
        current_work_items = list(
            MilestoneIssue.objects.filter(milestone=instance, deleted_at__isnull=True).values_list(
                "issue_id", flat=True
            )
        )

        # Calculate diff (following pattern from IssueSerializer lines 277-312)
        work_items_to_add = list(set(work_item_ids) - set(current_work_items))
        work_items_to_remove = list(set(current_work_items) - set(work_item_ids))

        # Store for activity logging
        self.work_items_to_add = work_items_to_add
        self.work_items_to_remove = work_items_to_remove

        # Delete the work items to remove
        MilestoneIssue.objects.filter(milestone=instance, issue_id__in=work_items_to_remove).delete()

        # Bulk create new work items
        try:
            MilestoneIssue.objects.bulk_create(
                [
                    MilestoneIssue(
                        milestone=instance,
                        issue_id=work_item_id,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for work_item_id in work_items_to_add
                ],
                batch_size=10,
                ignore_conflicts=True,
            )
        except IntegrityError:
            pass

        return instance


class MilestoneWriteSerializer(BaseSerializer):
    def validate_title(self, value):
        project_id = self.context.get("project_id") or (self.instance.project_id if self.instance else None)
        exclude_id = self.instance.id if self.instance else None
        if project_id:
            if not Milestone.is_valid_title(value, project_id, exclude_id=exclude_id):
                raise serializers.ValidationError("A milestone with this title already exists in the project.")
        return value

    description = DescriptionSerializer(required=False)

    def create(self, validated_data):
        description_data = validated_data.pop("description", None)

        project_id = self.context["project_id"]
        workspace_id = self.context["workspace_id"]

        # handle description after milestone creation to get workspace_id
        if description_data:
            serializer = DescriptionSerializer(data=description_data)
            serializer.is_valid(raise_exception=True)
            description = serializer.save(
                workspace_id=workspace_id,
                project_id=project_id,
            )
            validated_data["description"] = description

        milestone = super().create(validated_data)
        return milestone

    def update(self, instance, validated_data):
        description_data = validated_data.pop("description", None)
        workspace_id = instance.workspace_id
        project_id = instance.project_id

        if description_data:
            serializer = DescriptionSerializer(instance.description, data=description_data, partial=True)
            serializer.is_valid(raise_exception=True)
            description = serializer.save(
                workspace_id=workspace_id,
                project_id=project_id,
            )
            validated_data["description"] = description

        milestone = super().update(instance, validated_data)
        return milestone

    class Meta:
        model = Milestone
        fields = [
            "id",
            "title",
            "description",
            "target_date",
            "external_source",
            "external_id",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class MilestoneSerializer(BaseSerializer):
    description = DescriptionSerializer(read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Milestone
        fields = [
            "id",
            "workspace_id",
            "project_id",
            "title",
            "description",
            "target_date",
            "external_source",
            "external_id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "progress",
        ]
        read_only_fields = fields

    def get_progress(self, obj):
        return {
            "total_items": getattr(obj, "total_issues_count", 0),
            "completed_items": getattr(obj, "completed_issues_count", 0),
            "cancelled_items": getattr(obj, "cancelled_issues_count", 0),
        }
