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

from django.db import IntegrityError

from rest_framework import serializers

from plane.db.models import (
    Issue,
    IssueAssignee,
    IssueLabel,
    Label,
    State,
    User,
)
from plane.app.serializers import BaseSerializer


class EpicSerializer(BaseSerializer):
    assignees = serializers.SerializerMethodField()
    labels = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = "__all__"

    def get_assignees(self, obj):
        return [issue_assignee.assignee_id for issue_assignee in obj.issue_assignee.all()]

    def get_labels(self, obj):
        return [label_issue.label_id for label_issue in obj.label_issue.all()]


class EpicCreateSerializer(BaseSerializer):
    state_id = serializers.PrimaryKeyRelatedField(
        source="state", queryset=State.objects.all(), required=False, allow_null=True
    )
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent", queryset=Issue.objects.all(), required=False, allow_null=True
    )
    assignee_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.values_list("id", flat=True)),
        write_only=True,
        required=False,
    )
    label_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.values_list("id", flat=True)),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Issue
        fields = "__all__"
        read_only_fields = [
            "id",
            "type_id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        if (
            data.get("start_date", None) is not None
            and data.get("target_date", None) is not None
            and data.get("start_date", None) > data.get("target_date", None)
        ):
            raise serializers.ValidationError("Start date cannot exceed target date")

        if (
            data.get("state")
            and not State.objects.filter(project_id=self.context.get("project_id"), pk=data.get("state").id).exists()
        ):
            raise serializers.ValidationError("State is not valid please pass a valid state_id")

        return data

    def create(self, validated_data):
        assignees = validated_data.pop("assignees", validated_data.pop("assignee_ids", None))
        labels = validated_data.pop("labels", validated_data.pop("label_ids", None))

        project_id = self.context["project_id"]
        workspace_id = self.context["workspace_id"]
        type_id = self.context["type_id"]

        issue = Issue.objects.create(**validated_data, project_id=project_id, type_id=type_id)

        created_by_id = issue.created_by_id
        updated_by_id = issue.updated_by_id

        if assignees is not None and len(assignees):
            try:
                IssueAssignee.objects.bulk_create(
                    [
                        IssueAssignee(
                            assignee_id=user,
                            issue=issue,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for user in assignees
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
            except IntegrityError:
                pass

        if labels is not None and len(labels):
            try:
                IssueLabel.objects.bulk_create(
                    [
                        IssueLabel(
                            label_id=label,
                            issue=issue,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for label in labels
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
            except IntegrityError:
                pass

        return issue

    def update(self, instance, validated_data):
        assignees = validated_data.pop("assignees", validated_data.pop("assignee_ids", None))
        labels = validated_data.pop("labels", validated_data.pop("label_ids", None))

        project_id = instance.project_id
        workspace_id = instance.workspace_id
        created_by_id = instance.created_by_id
        updated_by_id = instance.updated_by_id

        if assignees is not None:
            current_assignees = IssueAssignee.objects.filter(issue=instance).values_list("assignee_id", flat=True)
            assignees_to_add = list(set(assignees) - set(current_assignees))
            assignees_to_remove = list(set(current_assignees) - set(assignees))

            IssueAssignee.objects.filter(issue=instance, assignee_id__in=assignees_to_remove).delete()

            try:
                IssueAssignee.objects.bulk_create(
                    [
                        IssueAssignee(
                            assignee_id=assignee_id,
                            issue=instance,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for assignee_id in assignees_to_add
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
            except IntegrityError:
                pass

        if labels is not None:
            current_labels = IssueLabel.objects.filter(issue=instance).values_list("label_id", flat=True)
            labels_to_add = list(set(labels) - set(current_labels))
            labels_to_remove = list(set(current_labels) - set(labels))

            IssueLabel.objects.filter(issue=instance, label_id__in=labels_to_remove).delete()

            try:
                IssueLabel.objects.bulk_create(
                    [
                        IssueLabel(
                            label_id=label_id,
                            issue=instance,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for label_id in labels_to_add
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
            except IntegrityError:
                pass

        if validated_data:
            return super().update(instance, validated_data)
        return instance
